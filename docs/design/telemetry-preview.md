# Telemetry project preview

## Scope and appearance

Targeted addition to the existing portfolio, preserving the dark background,
orange accent, Poppins text, Black Ops One page headings, routes, and gallery.
Design variance 6, motion intensity 4, density 4: motion illustrates a recorded
signal comparison; it pauses offscreen, in hidden tabs, and on user request.
The preceding mobile-spacing fix remains in place on telemetry and MD-HI.

## Sources and extraction

Local reference: `docs/telemetry_pbl_group3-master.zip` (ignored and unpublished).
The archive contains 324 files. Large workbooks, the 33 MB PSD-ready table,
combined segment CSV, images, and logs were not loaded for this implementation.
Repository Python was read as source, never executed.

`scripts/prepare-telemetry-data.py` streams only the first 168 data rows of each:

- `data/processed/selected_segments/NO2_S10_segment_2.csv`
- `data/processed/selected_segments/O3_S10_segment_2.csv`
- `data/processed/selected_segments/PM10_S10_segment_2.csv`
- `data/processed/selected_segments/PM2_5_S10_segment_3.csv`

Each series covers 2022-08-16 08:00 through 2022-08-23 07:00 UTC, hourly.
The numeric pairs retain the exported `value_raw` and `value_sg` values.
The generator validates finite values, identity, count, and hourly continuity.
Each exported series carries its source path and the ZIP member CRC for provenance.
No interpolation, filtering, or sampling reduction is performed in preparation.

The handoff README explicitly defines `value_raw` as the cleaned signal after
preprocessing, not original workbook data. Both the legend and source disclosure
preserve this distinction. Source code specifies an 11-sample, second-order
Savitzky-Golay filter. This preview does not re-run or certify the source pipeline.
It shows saved outputs without implying calibrated accuracy or safety thresholds.

## Page copy evidence

The 25 October scope correction also uses the supplied `TELE_523_PBL.pdf`
report, especially section 5.2 (page 9) and section 6.2 (pages 16–17).
The report and repository comparison table both name AM, FM, ASK, FSK and
PSK; PAM is not listed in either. PCM belongs to the separate digital
telemetry stage. These are simulated modulation comparisons, not a deployed
radio network or a universal ranking of transmission methods.

The card and opening copy now describe the whole team project. The cream
thumbnail shows preparation, transmission through noise, recovery and
monitoring. The interactive replay remains explicitly the author's signal
preparation contribution. Removed the unsupported card claim “in production”.

- `results/Preprocessing report results/tables/table_1_dataset_summary.csv`:
  193,120 + 205,190 + 193,120 + 205,190 = 796,620 rows across four pollutants.
- `data/processed/turdata_qc_summary.csv`: NO2 S9 has 101/12,070 missing
  readings (0.8368%) and 8,111 known-invalid records (67.1997%).
- `src/signal_processing_lead/preprocessing.py` and `sensor_selection.py`:
  explicit documented-drift flag and exclusion for NO2 S9; primary, acceptable,
  and exclude categories based on missingness and that known issue.
- `results/filter_metrics_comparison.csv`: Savitzky-Golay peak retention exceeds
  moving-average peak retention for all four reported NO2 sensors. This does
  not mean every peak or every pollutant is preserved better.
- `results/modulation/modulation_comparison_table.csv`: five schemes; saved
  ASK/FSK/PSK mean BER is zero under the tested conditions. Avoid universal
  reliability claims or attributing those results to the parity-check module.
- `src/monitoring_lead/dashboard.py`: six original Streamlit tabs.

The old contact-page SEO description is replaced with project-specific metadata.
The prior blanket claim about preserving long gaps is replaced with a narrower
description: source interpolation uses a limited fill, and the preview has no
original missingness flags from which to reconstruct a cleaning animation.

## Interaction and accessibility

One fixed selected pollutant loops over 16 seconds with a two-second hold.
Switching pollutants preserves the inspected time. Compare, Before, and Filtered
views share the same axis within a pollutant; axis limits change across pollutants.
Only the visual cursor interpolates between points. Numeric readings use actual
source samples (one decimal place for display). Scrubbing pauses playback.
Reduced-motion visitors start on a complete static chart; Play is explicit.
Playback suspends offscreen and when the browser tab is hidden. There is no
per-frame live-region announcement. Native buttons/range input support keyboard
use, and the range exposes time and both values through `aria-valuetext`.

All five existing screenshots remain in a lower gallery. They and the project
narrative remain available when JavaScript or the demo data cannot load.
