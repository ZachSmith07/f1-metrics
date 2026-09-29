# F1 Metrics

Web app for analysing live and historical Formula 1 timing data. Live at [f1-metrics.com](https://www.f1-metrics.com/).

<!-- Add a screenshot or short GIF here. This matters more than any text below. -->
## Screenshots

<a href="https://www.f1-metrics.com/session/2025/10)%20Canadian%20Grand%20Prix/Qualifying">
  <img width="100%" alt="F1 Metrics - 2025 Canadian Grand Prix Qualifying" src="https://github.com/user-attachments/assets/5cb8a378-9aca-495c-bddc-1749e049b7ec" />
</a>

<a href="https://www.f1-metrics.com/session/2025/10)%20Canadian%20Grand%20Prix/Qualifying">
  <img width="100%" alt="F1 Metrics - 2025 Canadian Grand Prix Qualifying" src="https://github.com/user-attachments/assets/e45b516e-8989-4f6b-9bf5-e00501bd94b3" />
</a>

<a href="https://www.f1-metrics.com/session/2025/22)%20Las%20Vegas%20Grand%20Prix/Race">
  <img width="100%" alt="F1 Metrics - 2025 Las Vegas Grand Prix Race" src="https://github.com/user-attachments/assets/5defd902-7a2d-4329-881b-4f365d08af60" />
</a>

## Live Screenshots

<img width="2347" height="1295" alt="image" src="https://github.com/user-attachments/assets/71807c9c-d20d-48ce-9298-5c5336bf43a0" />
<img width="2340" height="1295" alt="image" src="https://github.com/user-attachments/assets/296acd3f-bcbe-41cc-8a34-fd7f0bc8a344" />



## Features

- Accurate telemetry data across 4 seasons stored online (although only 2025 currently accessible through the website)
- Live data was available until FOM brought in measures to stop live data being accessed (this included live telemetry and positioning)
- Many ways of analysing the data from races, qualifying and practice sessions including (track map comparison, telemetry comparisions with time delta graph, strategy, lap times, min/max speeds, position changes, pit-time, results)

## Technical highlights

### Custom compression format

Each race weekend's telemetry was hundreds of MB as JSON, too large to store and serve on Firebase's free tier. I replaced JSON with a custom binary format, `.f1`, designed around the range of each value.

Each telemetry sample is bit-packed using only the bits its range needs:

| Field | Encoding |
|---|---|
| Speed (0-370) | 9-bit unsigned integer |
| Gear | 3-bit unsigned integer |
| Throttle (0-100) | 7-bit unsigned integer |
| Brake, DRS | 1 bit each |
| X, Y position | 16-bit signed integers |
| Time | 20 bits: 17-bit mantissa and 3-bit exponent |
| Relative distance | 14-bit fraction |

The time encoding keeps millisecond precision for lap-length values, while the exponent allows sessions of up to several hours (practice sessions include time in the pits) at coarser precision, which is all that is needed there. Fields that are never used, such as the Z coordinate and raw distance, are not stored, and relative distance is stored as a fraction. That comes to about 87 bits per sample (can change given RLE), compared with the many characters per sample JSON needs.

Telemetry also repeats a lot. Throttle sits at 100% for a whole straight, for example, and brake and DRS change rarely. I added run-length encoding: a flag bit after each value says whether the next value is the same, and if it is, a 6-bit count says how many times it repeats.

Results for one lap of telemetry:

| Format | Size | Reduction |
|---|---|---|
| JSON | 114,686 bytes | none |
| `.f1` (bit-packing) | 7,017 bytes | 93.9% |
| `.f1` (with run-length encoding) | 6,248 bytes | 94.6% |

Across the whole 2024 season this cut the stored data from 11.4 GB to 772 MB (93%). Four seasons of session and driver telemetry are currently stored in under 3 GB.

A single season would be larger than all seasons currently stored (by 4x) without the compression.

### Historical data pipeline

Historical telemetry is fetched with FastF1. I wrote my own code to process and compress it into the `.f1` format and upload it to cloud storage. Each lap of telemetry is stored as its own file, so the app only downloads what a page needs and loads quickly.

### Live data pipeline

Live data came from the SignalR endpoint used by the official F1 app. The payloads were encoded and awkward to work with, so I decoded them using OpenF1's live listener as a reference, plus my own reverse engineering for the parts it didn't cover. I converted the decoded data into a cleaner format and uploaded it to cloud storage in 2.5 second chunks. Clients read those files directly, so no paid server was needed.

## Stack

TypeScript, Next.js, Firebase

## Testing

Full walkthrough of the app from a testing session (just over an hour): [watch on YouTube](https://www.youtube.com/watch?v=ZpW4yfNHFZg)
