"use client";

import React, { useState, useEffect } from "react";
import { Box, Typography, ThemeProvider, CssBaseline, ToggleButtonGroup, ToggleButton, Stack, LinearProgress } from "@mui/material";
import { LapData } from "../classes/lapData";
import { DriverData } from "../classes/driverData";
import ChooseLaps from "./ChooseLap";
import { fetchTelemetryData } from "../utils/fetchTelemetryData";
import { TelemetryFrame } from "../classes/telemetryData";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// input to page section
type SpeedDistanceProps = {
  laps: LapData[][];
  drivers: DriverData[];
  year: string;
  round: string;
  session: string;
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

// single frame for tooltip
interface TelemetryFrameMeta {
  metadata: DriverData,
  telemetryFrame: TelemetryFrame
}


const SpeedDistance: React.FC<SpeedDistanceProps> = ({ laps, drivers, year, round, session }) => {

  // contains all loaded laps
  const [loadedLaps, setLoadedLaps] = useState<AllDataLap[]>([]);

  // contains bounds of graph
  const [minDelta, setMinDelta] = useState<number>(0);
  const [maxDelta, setMaxDelta] = useState<number>(0.1);
  const [minSpeed, setMinSpeed] = useState<number>(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(10);

  // loads telemetry from online
  const loadLap = async (lap: LapData, driver: DriverData) => {
    let frames: TelemetryFrame[] = await fetchTelemetryData(year, round, session, driver.firstName + " " + driver.lastName, lap.lapNumber, lap.lapTime);

    // adds to previous laps
    let newLaps = [...loadedLaps];
    newLaps.push({ lap: lap, legend: { driverName: driver.firstName + " " + driver.lastName, teamColour: driver.teamColour, isDashed: loadedLaps.map((lap) => lap.legend.teamColour).includes(driver.teamColour) }, driver: driver, frames: frames });

    // calculates new deltas
    calculateDeltas(newLaps);
  }


  const calculateDeltas = (laps: AllDataLap[]) => {
    if (laps.length > 0) {
      // copy of laps
      let cLapsData = [...laps]

      // minimum lap time (large number at first)
      let minLap = 999;
      let ind = 0;
      for (let i = 0; i < laps.length; i++) {
        if (laps[i].lap.lapTime < minLap) {
          minLap = laps[i].lap.lapTime;
          ind = i;
        }
      }

      // sets the fastest lap to the one to compare to
      let comparitorFrames = cLapsData[ind].frames;

      // goes through each lap and calculates the delta
      for (let i = 0; i < cLapsData.length; i++) {
        // current lap comparing
        let comparisonFrames = cLapsData[i].frames;

        // sets current frame index (so O(n) instead of O(n^2))
        let currentIndex = 0;
        for (let j = 0; j < comparisonFrames.length; j++) {
          // finds the frames the current frame of this lap sits between
          for (let k = currentIndex; k < comparitorFrames.length; k++) {
            if (comparitorFrames[k].relativeDistance > comparisonFrames[j].relativeDistance) {
              break;
            }
            else {
              currentIndex = k + 0;
            }
          }

          if (currentIndex == comparitorFrames.length - 1) {
            // if is the final frame sets difference to the difference in lap time
            let delta = cLapsData[i].lap.lapTime - cLapsData[ind].lap.lapTime;

            cLapsData[i].frames[j].deltaTime = delta;
          }
          else {
            // calculates the delta time between multiple frames

            // finding proportional distance between the 2 frames the current frame sits between
            let currentDist = comparisonFrames[j].relativeDistance;
            let dist1 = comparitorFrames[currentIndex].relativeDistance;
            let dist2 = comparitorFrames[currentIndex + 1].relativeDistance;
            let proportion = (currentDist - dist1) / (dist2 - dist1);

            // calculates the time the other lap is on at the same relative distance
            let otherTime = proportion * comparitorFrames[currentIndex + 1].time + (1 - proportion) * comparitorFrames[currentIndex].time;

            // finds the difference
            let delta = comparisonFrames[j].time - otherTime;

            // sets the delta
            cLapsData[i].frames[j].deltaTime = delta;
          }
        }
      }

      // finds minimum and maximum bounds of speed and delta
      let minDelta = 0.1;
      let maxDelta = -0.1;
      let minSpeed = 300;
      let maxSpeed = 0;
      for (let i = 0; i < cLapsData.length; i++) {
        for (let j = 0; j < cLapsData[i].frames.length; j++) {
          if (minDelta > cLapsData[i].frames[j].deltaTime) {
            minDelta = cLapsData[i].frames[j].deltaTime;
          }
          if (maxDelta < cLapsData[i].frames[j].deltaTime) {
            maxDelta = cLapsData[i].frames[j].deltaTime;
          }


          if (minSpeed > cLapsData[i].frames[j].speed) {
            minSpeed = cLapsData[i].frames[j].speed;
          }
          if (maxSpeed < cLapsData[i].frames[j].speed) {
            maxSpeed = cLapsData[i].frames[j].speed;
          }
        }
      }

      // calculates bounds by rounding down/up to the nearest 10
      minSpeed = Math.floor((minSpeed - 1) / 10) * 10;
      maxSpeed = Math.ceil((maxSpeed + 1) / 10) * 10;
      minDelta = Math.floor(minDelta * 10) / 10;
      maxDelta = Math.ceil(maxDelta * 10) / 10;

      // sets bounds
      setMinSpeed(minSpeed);
      setMaxSpeed(maxSpeed);
      setMinDelta(minDelta);
      setMaxDelta(maxDelta);

      // sets the new laps to be rendered
      setLoadedLaps(cLapsData);
    }

    else {
      console.log("NO DELTAS");
    }
  };



  // defines all tooltips
  const CustomTooltip = ({ active, payload, label, type, }: { active?: boolean; payload?: any[]; label?: number; type: string; }) => {
    if (active && payload && payload.length && label) {
      // finds the frame hovered over
      let frames: TelemetryFrameMeta[] = [];
      for (let i = 0; i < loadedLaps.length; i++) {
        for (let j = 0; j < loadedLaps[i].frames.length; j++) {
          if (loadedLaps[i].frames[j].relativeDistance > label) {
            if (j > 0) {
              if (label - loadedLaps[i].frames[j - 1].relativeDistance < loadedLaps[i].frames[j].relativeDistance - label) {
                frames.push({ metadata: loadedLaps[i].driver, telemetryFrame: loadedLaps[i].frames[j - 1] });
              }
              else {
                frames.push({ metadata: loadedLaps[i].driver, telemetryFrame: loadedLaps[i].frames[j] });
              }
            }
            else {
              frames.push({ metadata: loadedLaps[i].driver, telemetryFrame: loadedLaps[i].frames[j] });
            }
            break;
          }
        }
      }
      return (
        // background for tooltip
        <div style={{
          background: "#333",
          color: "#fff",
          padding: "10px",
          border: "1px solid #555",
          borderRadius: "5px",
          boxShadow: "0px 0px 5px rgba(0,0,0,0.4)"
        }}>
          {/* shows percentage distance on current lap */}
          <p style={{ fontWeight: "bold", marginBottom: "5px" }}>Distance {(label * 100).toFixed(1)}%</p>
          {frames.map((entry, index) => {
            if (type == "speed") {
              // displays rest of speed tooltip
              return (
                <div key={index} style={{ marginBottom: "5px" }}>
                  <p style={{ fontWeight: "bold", color: `${entry.metadata.teamColour}`, margin: 0 }}>
                    {entry.metadata.lastName}
                  </p>
                  {/* green if drs */}
                  <p style={{ margin: "2px 0", color: entry.telemetryFrame.drs == 1 ? "#00FF00" : "#EAEAEA", fontWeight: entry.telemetryFrame.drs == 1 ? "bold" : "regular" }}>Speed: {entry.telemetryFrame.speed} ({entry.telemetryFrame.deltaTime < 0 ? "" : "+"}{entry.telemetryFrame.deltaTime.toFixed(3)})</p>
                  <p style={{ margin: "2px 0" }}>Throttle: {entry.telemetryFrame.throttle}%</p>
                  <p style={{ margin: "2px 0", fontWeight: "bold", color: entry.telemetryFrame.brake == 1 ? "#FF1111" : "#AAAAAA" }}>
                    Brake
                    <span style={{ color: "#EAEAEA", fontWeight: "normal", marginLeft: "40px" }}>
                      Gear: {entry.telemetryFrame.gear}
                    </span>
                  </p>

                </div>
              );
            }
            else if (type == "deltaTime") {
              // displays delta tooltip
              return (
                <div key={index} style={{ marginBottom: "5px" }}>
                  <p style={{ fontWeight: "bold", color: `${entry.metadata.teamColour}`, margin: 0 }}>
                    {entry.metadata.lastName}
                  </p>
                  {/* green if drs, red if brake, otherwise light grey */}
                  <p style={{ margin: "2px 0", color: entry.telemetryFrame.drs == 1 ? "#00FF00" : entry.telemetryFrame.brake ? "#FF0000" : "#EAEAEA", fontWeight: "bold" }}>Speed: {entry.telemetryFrame.speed} ({entry.telemetryFrame.deltaTime < 0 ? "" : "+"}{entry.telemetryFrame.deltaTime.toFixed(3)})</p>

                </div>
              );
            }
            else if (type == "throttle") {
              // throttle tooltip
              return (
                <div key={index} style={{ marginBottom: "5px" }}>
                  <p style={{ fontWeight: "bold", color: `${entry.metadata.teamColour}`, margin: 0 }}>
                    {entry.metadata.lastName} ({entry.telemetryFrame.throttle}%)
                  </p>
                </div>
              );
            }
            else if (type == "brake") {
              // brake tooltip
              return (
                <div key={index} style={{ marginBottom: "5px" }}>
                  <p style={{ fontWeight: "bold", color: `${entry.metadata.teamColour}`, margin: 0 }}>
                    {entry.metadata.lastName} ({entry.telemetryFrame.brake == 1 ? "ON" : "OFF"})
                  </p>
                </div>
              );
            }
            else if (type == "gear") {
              // gear tooltip
              return (
                <div key={index} style={{ marginBottom: "5px" }}>
                  <p style={{ fontWeight: "bold", color: `${entry.metadata.teamColour}`, margin: 0 }}>
                    {entry.metadata.lastName} ({entry.telemetryFrame.gear})
                  </p>
                </div>
              );
            }
          })}
        </div>
      );
    }
    return null;
  };


  return (
    <Box>
      <Box sx={{}} height={"calc(100vh)"} gap={2}>
        {
          loadedLaps.length == 0 ?
            // default text if not picked a lap
            <Typography>
              Pick a lap to load - you can click the title columns to sort
            </Typography>
            :
            // if lap picked displays each chart
            <ResponsiveContainer width="100%" height="65%">
              {/* speed chart */}
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} tickCount={11} height={30} tickFormatter={(val, ind) => { return `${val * 100}%` }} />
                <YAxis domain={[minSpeed, maxSpeed]} tick={{ fill: 'white' }} width={55} label={{ value: "Speed (km/h)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle" } }} />
                <Tooltip content={(props) => <CustomTooltip {...props} type="speed" />} />
                {loadedLaps.map((lapData, index) => (
                  <Line
                    key={index}
                    name={loadedLaps[index].driver.lastName}
                    type="linear"
                    data={lapData.frames}
                    dataKey="speed"
                    stroke={loadedLaps[index].legend.teamColour}
                    strokeWidth={2}
                    dot={false}
                    activeDot={false}
                    strokeDasharray={loadedLaps[index].legend.isDashed ? "5,5" : ""}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
        }
        {
          loadedLaps.length > 0 && <ResponsiveContainer width="100%" height={280}>
            {/* delta time chart */}
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} tickCount={11} height={30} tickFormatter={(val, ind) => { return `${val * 100}%` }} />
              <YAxis domain={[minDelta, maxDelta]} tick={{ fill: 'white' }} width={55} label={{ value: "Delta to fastest (s)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle" } }} />
              <Tooltip content={(props) => <CustomTooltip {...props} type="deltaTime" />} />
              {loadedLaps.map((lapData, index) => (
                <Line
                  key={index}
                  name={loadedLaps[index].driver.lastName}
                  type="linear"
                  data={lapData.frames}
                  dataKey="deltaTime"
                  stroke={loadedLaps[index].legend.teamColour}
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  strokeDasharray={loadedLaps[index].legend.isDashed ? "5,5" : ""}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        }
        {
          loadedLaps.length > 0 && <ResponsiveContainer width="100%" height={120}>
            {/* throttle chart */}
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} height={0} tickCount={11} />
              <YAxis domain={[-1, 101]} tick={false} axisLine={true} width={55} label={{ value: "Throttle (%)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle" } }} />
              <Tooltip content={(props) => <CustomTooltip {...props} type="throttle" />} />
              {loadedLaps.map((lapData, index) => (
                <Line
                  key={index}
                  name={loadedLaps[index].driver.lastName}
                  type="linear"
                  data={lapData.frames}
                  dataKey="throttle"
                  stroke={loadedLaps[index].legend.teamColour}
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  strokeDasharray={loadedLaps[index].legend.isDashed ? "5,5" : ""}
                />
              ))}

            </LineChart>
          </ResponsiveContainer>
        }
        {
          loadedLaps.length > 0 && <ResponsiveContainer width="100%" height={120}>
            {/* brake chart */}
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} height={0} tickCount={11} />
              <YAxis domain={[-0.1, 1.1]} tick={false} axisLine={true} width={55} label={{ value: "Brake (on/off)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle" } }} />
              <Tooltip content={(props) => <CustomTooltip {...props} type="brake" />} />
              {loadedLaps.map((lapData, index) => (
                <Line
                  key={index}
                  name={loadedLaps[index].driver.lastName}
                  type="linear"
                  data={lapData.frames}
                  dataKey="brake"
                  stroke={loadedLaps[index].legend.teamColour}
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  strokeDasharray={loadedLaps[index].legend.isDashed ? "5,5" : ""}
                />
              ))}

            </LineChart>
          </ResponsiveContainer>
        }
        {
          loadedLaps.length > 0 && <ResponsiveContainer width="100%" height={120}>
            {/* gear chart */}
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} height={0} tickCount={11} />
              <YAxis domain={[0, 9]} tick={{ fill: 'white' }} tickCount={10} width={55} label={{ value: "Gear (1-8)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle" } }} />
              <Tooltip content={(props) => <CustomTooltip {...props} type="gear" />} />
              {loadedLaps.map((lapData, index) => (
                <Line
                  key={index}
                  name={loadedLaps[index].driver.lastName}
                  type="linear"
                  data={lapData.frames}
                  dataKey="gear"
                  stroke={loadedLaps[index].legend.teamColour}
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  strokeDasharray={loadedLaps[index].legend.isDashed ? "5,5" : ""}
                />
              ))}

            </LineChart>
          </ResponsiveContainer>
        }

        {/* select laps to load */}
        <ChooseLaps
          laps={laps}
          driversData={drivers}
          onChoose={(lap, driver) => {
            if (lap?.isLoaded) {
              // if lap isn't already loaded - loads the lap
              loadLap(lap!, driver!);
            }
            else {
              // otherwise deselects the lap
              let laps = [...loadedLaps];
              for (let i = 0; i < loadedLaps.length; i++) {
                if (loadedLaps[i].driver.firstName + loadedLaps[i].driver.lastName == driver!.firstName + driver!.lastName) {
                  laps.splice(i, 1);
                  break;
                }
              }
              setLoadedLaps(laps);
            }

          }}
          isCheckbox={false} />
      </Box>
    </Box>
  );
};

export default SpeedDistance;