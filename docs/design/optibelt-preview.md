# OPTIBELT portfolio preview

Full project name: Optimised Stockpile and Conveyor Belt Monitoring System.
OPTIBELT is the team's shorter, memorable name, as confirmed by the owner.

The case study describes a final-year team project. Sibusiso confirmed that he
developed the health index, was the main operator of the integrated system on
the Jetson Nano, and assisted across the other subsystems. It does not attribute
the camera, LiDAR, controller, or entire application to him individually.
The existing MD-HI page remains the focused study of the health-index work.

## Source and data meaning

Reference: owner-supplied `docs/OPTIBELT-main.zip`, from Gobakwe/OPTIBELT.
The README, dashboard code, motor-monitor logic, state definitions, and dataset
notes were inspected. The original application was not run against hardware.

- Motor preview: `data/scenarios/motor_replay/scenario_{healthy,warning,fault}.csv`.
  The exporter selects 121 evenly spaced source rows per file, retaining their
  one-based row positions and original `HI_pct` values. Rows follow file order;
  the plot is not a continuous time axis. Downsampling may omit short excursions.
- Thresholds match `src/motor_health/monitor.py`: below 20 is fault, above 80 is
  healthy, and 20 through 80 inclusive is warning. File names label scenarios;
  individual readings can belong to different health bands.
- Stockpile preview: all 1,369 XYZ points from each of the empty/low/medium/full
  synthetic references in `data/samples/lidar/reference_stockpiles/`. Heights
  use `560 - z` in millimetres. The view is a fixed isometric projection.
- Volume values are the dataset summary's target volumes in cubic centimetres.
  Fill percentage uses the full reference (approximately 5,337 cm³) as capacity;
  remaining capacity is full minus selected reference volume. The preview does
  not claim to recompute volume from the point cloud or validate physical scans.
- Belt inspection: manually selected illustrative values (78% health, one cut,
  no tears, two frayed regions), using the original dashboard's categories.
  They are not measured results, and the preview does not perform inference.
- System view: a description of the original architecture, not live connection
  status. The browser sends no hardware commands and has no control backend.

`scripts/prepare-optibelt-data.py` regenerates `js/optibelt-data.js` without
extracting or executing archive contents. The generated file records the archive
SHA-256 for traceability. No source archive, local configuration, full research
document, camera image, or credential is included in the public artifact.

## Presentation

Native HTML/CSS/JavaScript preserves the portfolio's typography and orange accent.
The default tab highlights the owner's health-index contribution. The main text
explains purpose and role; implementation details use a native disclosure. Tabs
support arrow, Home, and End keys; the sample slider supports native keyboard
operation. There are no timers, autoplay, external scripts, or runtime packages.

The project thumbnail is a screenshot of this browser preview, not the original
Streamlit application. Its alt text identifies it as a redesigned preview.

## MD-HI animated preview

The MD-HI case-study hero reuses the motor replay samples in an accelerated loop.
Each scenario traces for 16 seconds, holds for 1.8 seconds, then advances to the
next file. The tracer interpolates visually between points; numerical readouts
always show a source sample. These scenario files are separate demonstrations,
not a continuous failure recording. Playback pauses when offscreen or when the
tab is hidden. Reduced-motion preference starts paused; explicit Play is available.
A manual pause persists through scrolling, tab visibility changes, and resizing.
The original illustration remains only as a no-JavaScript fallback and collection
thumbnail. No original project validation claims were changed.
