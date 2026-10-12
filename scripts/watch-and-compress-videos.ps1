<#
.SYNOPSIS
Watches assets\images and creates progressive-playback MP4 copies of added videos.

.DESCRIPTION
Requires FFmpeg on PATH, or supply -FfmpegPath. Originals are never changed.
The first run also processes existing videos that do not have a current optimized copy.
Use -Once to encode and exit; -Force regenerates existing optimized copies.
MaxWidth bounds BOTH dimensions without upscaling. Defaults: 1280px, CRF 23,
30 fps, H.264/yuv420p, optional AAC 96k, two-second keyframes and fast-start.

.EXAMPLE
powershell -ExecutionPolicy Bypass -File .\scripts\watch-and-compress-videos.ps1

.EXAMPLE
.\scripts\watch-and-compress-videos.ps1 -InputDirectory .\assets\images -Crf 24
#>
param(
    [switch]$Once,
    [switch]$Force,
    [string]$FfmpegPath = 'ffmpeg',
    [string]$InputDirectory = (Join-Path $PSScriptRoot '..\assets\images'),
    [ValidateRange(18, 30)]
    [int]$Crf = 23,
    [ValidateRange(1, 1920)]
    [int]$MaxWidth = 1280,
    [ValidateSet('ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow')]
    [string]$Preset = 'slow'
)

$ErrorActionPreference = 'Stop'
$ffmpeg = Get-Command $FfmpegPath -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
    throw 'FFmpeg was not found on PATH. Install FFmpeg, reopen PowerShell, and run this script again.'
}

$directory = (Resolve-Path -LiteralPath $InputDirectory).Path
$supportedExtensions = @('.mp4', '.m4v', '.mov', '.mkv', '.avi', '.webm')
$watcher = [System.IO.FileSystemWatcher]::new($directory, '*')
$watcher.IncludeSubdirectories = $false
$watcher.NotifyFilter = [System.IO.NotifyFilters]'FileName, LastWrite, Size'

function Wait-ForCompleteFile {
    param([Parameter(Mandatory)][string]$Path)

    $deadline = [DateTime]::UtcNow.AddMinutes(5)
    $lastLength = -1L
    $lastWriteTime = [DateTime]::MinValue
    $stableIntervals = 0

    while ([DateTime]::UtcNow -lt $deadline) {
        if (Test-Path -LiteralPath $Path -PathType Leaf) {
            $file = Get-Item -LiteralPath $Path
            if ($file.Length -eq $lastLength -and $file.LastWriteTimeUtc -eq $lastWriteTime) {
                $stableIntervals++
                if ($stableIntervals -ge 2) {
                    return
                }
            }
            else {
                $lastLength = $file.Length
                $lastWriteTime = $file.LastWriteTimeUtc
                $stableIntervals = 0
            }
        }
        Start-Sleep -Seconds 2
    }

    throw "Timed out waiting for the video file to finish copying: $Path"
}

function Compress-Video {
    param([Parameter(Mandatory)][string]$Path)

    $extension = [System.IO.Path]::GetExtension($Path).ToLowerInvariant()
    $name = [System.IO.Path]::GetFileNameWithoutExtension($Path)
    if ($supportedExtensions -notcontains $extension -or $name -match '-optimized(?:\.encoding)?$') {
        return
    }
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return }

    Wait-ForCompleteFile -Path $Path

    $source = Get-Item -LiteralPath $Path
    $output = Join-Path $source.DirectoryName ($name + '-optimized.mp4')
    if (Test-Path -LiteralPath $output -PathType Leaf) {
        $existingOutput = Get-Item -LiteralPath $output
        if (-not $Force -and $existingOutput.Length -gt 0 -and $existingOutput.LastWriteTimeUtc -ge $source.LastWriteTimeUtc) {
            Write-Host "Already compressed and up to date: $($source.Name)"
            return
        }
    }

    $scaleFilter = "scale=w='min($MaxWidth,iw)':h='min($MaxWidth,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30"
    $temporaryOutput = Join-Path $source.DirectoryName ($name + '-optimized.encoding.mp4')
    Write-Host "Compressing $($source.Name) -> $([System.IO.Path]::GetFileName($output))"
    & $ffmpeg.Source -hide_banner -loglevel warning -y -i $source.FullName -map '0:v:0' -map '0:a:0?' -vf $scaleFilter -c:v libx264 -preset $Preset -crf $Crf -pix_fmt yuv420p -g 60 -c:a aac -b:a 96k -ac 2 -movflags +faststart $temporaryOutput
    if ($LASTEXITCODE -ne 0) {
        if (Test-Path -LiteralPath $temporaryOutput -PathType Leaf) {
            Remove-Item -LiteralPath $temporaryOutput -Force
        }
        throw "FFmpeg failed to compress '$($source.FullName)' (exit code $LASTEXITCODE)."
    }

    # Publish only a completed encode; a failed run leaves the last good copy intact.
    Move-Item -LiteralPath $temporaryOutput -Destination $output -Force

    $result = Get-Item -LiteralPath $output
    Write-Host ('Finished: {0:N1} MB -> {1:N1} MB' -f ($source.Length / 1MB), ($result.Length / 1MB))
}

$createdSubscription = $null
$renamedSubscription = $null
$changedSubscription = $null
try {
    $createdSubscription = Register-ObjectEvent -InputObject $watcher -EventName Created -SourceIdentifier 'VideoCompression.Created'
    $renamedSubscription = Register-ObjectEvent -InputObject $watcher -EventName Renamed -SourceIdentifier 'VideoCompression.Renamed'
    $changedSubscription = Register-ObjectEvent -InputObject $watcher -EventName Changed -SourceIdentifier 'VideoCompression.Changed'
    $watcher.EnableRaisingEvents = $true

    if ($Once) { Write-Host "Encoding existing videos in $directory." }
    else { Write-Host "Watching $directory for videos. Press Ctrl+C to stop." }
    Get-ChildItem -LiteralPath $directory -File |
        Where-Object { $supportedExtensions -contains $_.Extension.ToLowerInvariant() } |
        ForEach-Object { Compress-Video -Path $_.FullName }

    if ($Once) { return }

    while ($true) {
        $event = Wait-Event -Timeout 2
        if (-not $event) {
            continue
        }

        $path = $event.SourceEventArgs.FullPath
        Remove-Event -EventIdentifier $event.EventIdentifier
        try { Compress-Video -Path $path }
        catch { Write-Warning $_.Exception.Message }
    }
}
finally {
    $watcher.EnableRaisingEvents = $false
    if ($createdSubscription) {
        Unregister-Event -SourceIdentifier 'VideoCompression.Created'
    }
    if ($renamedSubscription) {
        Unregister-Event -SourceIdentifier 'VideoCompression.Renamed'
    }
    if ($changedSubscription) {
        Unregister-Event -SourceIdentifier 'VideoCompression.Changed'
    }
    $watcher.Dispose()
}
