import { Box } from "@mui/material";
import { DriverData } from "../classes/driverData";
import { LapData } from "../classes/lapData";
import { TelemetryFrame } from "../classes/telemetryData";
import { useEffect, useState } from "react";

type TrackMapProps = {
  laps: AllDataLap[];
};

// data for the legend
interface DriverDataLegend {
  driverName: string;
  teamColour: string;
  isDashed: boolean;
}

// contains all data about 1 lap
interface AllDataLap {
  lap: LapData;
  legend: DriverDataLegend;
  driver: DriverData;
  frames: TelemetryFrame[];
}

// contains data of which driver is the fastest
interface DataPoint {
  legend: DriverDataLegend;
  driver: DriverData;
}

interface Point {
  x: number;
  y: number;
  relativeDistance: number;
}

export const TrackMap: React.FC<TrackMapProps> = ({ laps }) => {
  const [lapDataPoints, setLapDataPoints] = useState<DataPoint[]>([]);
  const [points, setPoints] = useState<Point[]>([]);

  // calculates adn finds where each driver is faster
  const calculateLapDataPoints = (laps: AllDataLap[]) => {
    const splits = 20; // 20 different segments
    let dataPoints: DataPoint[] = [];

    for (let i = 0; i < splits; i++) {
      let start = i / splits;
      let end = (i + 1) / splits;
      let timeTakens: number[] = [];

      for (let j = 0; j < laps.length; j++) {
        let time = 0;
        for (let k = 0; k < laps[j].frames.length - 1; k++) {
          if (
            laps[j].frames[k].relativeDistance < start &&
            laps[j].frames[k + 1].relativeDistance > start
          ) {
            time +=
              ((laps[j].frames[k + 1].relativeDistance - start) /
                (laps[j].frames[k + 1].relativeDistance -
                  laps[j].frames[k].relativeDistance)) *
              (laps[j].frames[k + 1].time - laps[j].frames[k].time);
          } else if (
            laps[j].frames[k + 1].relativeDistance < end &&
            laps[j].frames[k].relativeDistance > end
          ) {
            time +=
              ((laps[j].frames[k + 1].relativeDistance - end) /
                (laps[j].frames[k + 1].relativeDistance -
                  laps[j].frames[k].relativeDistance)) *
              (laps[j].frames[k + 1].time - laps[j].frames[k].time);
          } else if (
            laps[j].frames[k + 1].relativeDistance < end &&
            laps[j].frames[k].relativeDistance > start
          ) {
            time += laps[j].frames[k + 1].time - laps[j].frames[k].time;
          }
        }
        timeTakens.push(time);
      }

      const lowestIndex = timeTakens.indexOf(Math.min(...timeTakens));
      dataPoints.push({
        legend: laps[lowestIndex].legend,
        driver: laps[lowestIndex].driver,
      });
    }

    setLapDataPoints(dataPoints);
  };

  useEffect(() => {
    let minLapTime = 999999;
    let flIndex = -1;
    for (let i = 0; i < laps.length; i++) {
      if (laps[i].lap.lapTime !== -1 && laps[i].lap.lapTime < minLapTime) {
        flIndex = i;
        minLapTime = laps[i].lap.lapTime;
      }
    }

    if (flIndex !== -1) {
      let pts: Point[] = laps[flIndex].frames.map((val) => ({
        x: val.x,
        y: val.y,
        relativeDistance: val.relativeDistance
      }));
      setPoints(pts);
    }

    calculateLapDataPoints(laps);
  }, [laps]);

  // find x/y bounds
  const padding = 2;
  const bounds = points.reduce(
    (acc, p) => ({
      minX: Math.min(acc.minX, p.x) - padding,
      maxX: Math.max(acc.maxX, p.x) + padding,
      minY: Math.min(acc.minY, p.y) - 2 * padding,
      maxY: Math.max(acc.maxY, p.y) + padding,
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );

  // converts points to a path with each coordinate from 0-1
  const path = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${(p.x - bounds.minX) /
        (bounds.maxX - bounds.minX)} ${(p.y - bounds.minY) /
        (bounds.maxY - bounds.minY)}`
    )
    .join(" ") + " Z"; // z adds the closing

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "row" }}>
      {/* drivers key */}
      <Box
        sx={{
          minWidth: "150px",
          p: 1,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {laps.map((lap, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {/* colour box */}
            <Box
              sx={{
                width: 20,
                height: 10,
                bgcolor: lap.legend.teamColour,
                border: "1px solid #000",
              }}
            />
            {/* driver name and team */}
            <span>{lap.legend.driverName} ({lap.driver.teamName})</span>
          </Box>
        ))}
      </Box>

      {/* track map */}
      <Box sx={{ flex: 1, position: "relative" }}>
        <svg
          viewBox="0 0 1 1"
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%" }}
        >
          {/* wide black line */}
          <path
            d={path}
            fill="none"
            stroke="black"
            strokeWidth={0.05}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* thin driver coloured lines */}
          {points.slice(0, -1).map((p, i) => {
            const p1 = points[i];
            const p2 = points[i + 1];

            const x1 = (p1.x - bounds.minX) / (bounds.maxX - bounds.minX);
            const y1 = (p1.y - bounds.minY) / (bounds.maxY - bounds.minY);
            const x2 = (p2.x - bounds.minX) / (bounds.maxX - bounds.minX);
            const y2 = (p2.y - bounds.minY) / (bounds.maxY - bounds.minY);

            const segIndex = Math.floor(p1.relativeDistance / 0.05);
            const colour = lapDataPoints[segIndex]?.legend.teamColour ?? "#ffffff";

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={colour}
                strokeWidth={0.006}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </Box>
    </Box>
  );
};
