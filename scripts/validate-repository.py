"""Reject unintended tracked files and common credentials before deployment."""
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SECRET_PATTERNS = {
    "GitHub token": r"(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})",
    "AWS access key": r"(?:AKIA|ASIA)[A-Z0-9]{16}",
    "Google API key": r"AIza[A-Za-z0-9_-]{30,}",
    "OpenAI-style key": r"sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}",
    "private key": r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----",
    "AWS secret assignment": r"(?i)aws_secret_access_key[\"']?\s*[:=]\s*[\"']?[A-Za-z0-9/+]{35,}",
}
TEXT_EXTENSIONS = {".html", ".css", ".js", ".cjs", ".py", ".ps1", ".json",
                   ".txt", ".md", ".yml", ".yaml", ".svg"}


def validate_inventory(tracked, approved):
    unexpected = sorted(set(tracked) - set(approved))
    missing = sorted(set(approved) - set(tracked))
    if unexpected or missing:
        raise ValueError(f"Repository allowlist mismatch: unexpected={unexpected}; missing={missing}")
    if len(approved) != len(set(approved)):
        raise ValueError("Duplicate repository allowlist path")


def find_secrets(content):
    # Return labels only: never print the actual matching credential.
    return [label for label, pattern in SECRET_PATTERNS.items() if re.search(pattern, content)]


def main():
    approved = json.loads((ROOT / "scripts/repository-files.json").read_text(encoding="utf-8"))
    tracked = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode("utf-8").split("\0")
    tracked = [path for path in tracked if path]
    validate_inventory(tracked, approved)
    flagged = []
    scanned = 0
    for name in tracked:
        if Path(name).suffix not in TEXT_EXTENSIONS and name != ".gitignore":
            continue
        # Inspect the index, so local unstaged edits cannot hide staged secrets.
        content = subprocess.check_output(["git", "show", f":{name}"], cwd=ROOT).decode("utf-8")
        scanned += 1
        labels = find_secrets(content)
        if labels:
            flagged.append((name, labels))
    if flagged:
        raise ValueError(f"Potential credentials found (values redacted): {flagged}")
    print(f"PASS: {len(tracked)} approved tracked files; {scanned} text files scanned; no common credential matches.")
    print("This is a pattern check, not a guarantee that every type of secret is detected.")


if __name__ == "__main__":
    main()
