"use client";

import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell, LabelList, ReferenceLine } from "recharts";
import { Box, Typography, ThemeProvider, CssBaseline, ToggleButtonGroup, ToggleButton, Stack, LinearProgress } from "@mui/material";
import { LapData } from "../classes/lapData";
import { DriverData } from "../classes/driverData";
import { exo2, exo2Regular } from "../styles";
import darkTheme from "../theme";
import Navbar from "../components/Navbar";
import { fetchSessionData } from "../utils/fetchSessionData";
import { useParams } from "next/navigation";

interface SpeedsPerformance {
  team: string;
  value: number;
  color: string;
}

class Bounds {
  constructor(public minY: number, public maxY: number) { }

  toString() { return `Bounds(minY: ${this.minY}, maxY: ${this.maxY})` }
}


type SpeedsChartProps = {
  laps: LapData[][];
  drivers: DriverData[];
};

// displays the speed bar chart
const SpeedsChart: React.FC<SpeedsChartProps> = ({ laps, drivers }) => {
  // sets the bounds for min speeds
  const [minSpeedDrivers, setMinSpeedDriverData] = useState<SpeedsPerformance[]>([]);
  const [minSpeedDriverBounds, setMinSpeedDriverBounds] = useState<Bounds>(new Bounds(0, 10));
  const [minSpeedTeams, setMinSpeedTeamData] = useState<SpeedsPerformance[]>([]);
  const [minSpeedTeamBounds, setMinSpeedTeamBounds] = useState<Bounds>(new Bounds(0, 10));

  // sets bounds for max speed
  const [maxSpeedDrivers, setMaxSpeedDriverData] = useState<SpeedsPerformance[]>([]);
  const [maxSpeedDriverBounds, setMaxSpeedDriverBounds] = useState<Bounds>(new Bounds(0, 10));
  const [maxSpeedTeams, setMaxSpeedTeamData] = useState<SpeedsPerformance[]>([]);
  const [maxSpeedTeamBounds, setMaxSpeedTeamBounds] = useState<Bounds>(new Bounds(0, 10));

  // sets bounds for throttle
  const [throttleDrivers, setThrottleDriverData] = useState<SpeedsPerformance[]>([]);
  const [throttleDriverBounds, setThrottleDriverBounds] = useState<Bounds>(new Bounds(0, 10));
  const [throttleTeams, setThrottleTeamData] = useState<SpeedsPerformance[]>([]);
  const [throttleTeamBounds, setThrottleTeamBounds] = useState<Bounds>(new Bounds(0, 10));

  // sets whether displaying all drivers, or just teams
  const [dataType, setDataType] = useState<"teams" | "drivers">("teams");

  // changes between teams and drivers
  const handleDataChange = (_event: React.MouseEvent<HTMLElement>, newValue: "teams" | "drivers") => {
    if (newValue !== null) setDataType(newValue);
  };

  // sets what the y-axis is
  const [chartType, setChartType] = useState<"min" | "max" | "throttle">("min");
  // changes the y-axis
  const handleChartChange = (_event: React.MouseEvent<HTMLElement>, newValue: "min" | "max" | "throttle") => {
    if (newValue !== null) setChartType(newValue);
  };

  // calculates the speed from the lap data
  useEffect(() => {
    const fetchSpeeds = async () => {
      try {

        console.log(laps);
        console.log(drivers);

        let allLapsData = [...laps];
        let driversData = [...drivers];

        let fastestLapsData = [];

        for (let i = 0; i < allLapsData.length; i++) {
          // finds fastest lap
          let lapTimeData: LapData = new LapData(0, 999, 0, 0, 0, 0, "SOFT", 0, true, false, true, 0, 0, 0, 0, false, -1, -1, 0);
          for (let j = 0; j < allLapsData[i].length; j++) {
            const lapData = allLapsData[i][j];
            if (lapData.lapTime != -1 && !lapData.deleted) {
              if (lapData.lapTime < lapTimeData.lapTime) {
                lapTimeData = lapData;
              }
            }
          }

          fastestLapsData.push(lapTimeData);
        }


        // goes through in reverse order to remove slow laps (e.g. if a driver crashed on lap 1, therefore ruins the chart)
        for (let i = fastestLapsData.length - 1; i > -1; i--) {
          if (fastestLapsData[i].maxSpeed < 250 || fastestLapsData[i].minSpeed < 40 || fastestLapsData[i].throttle < 0.25) {
            fastestLapsData.splice(i, 1);
            driversData.splice(i, 1);
          }
        }


        // finds the fastest laps of each team
        let fastestLapsTeams: LapData[] = [];
        let teamsData: DriverData[] = [];
        let teamsIndex = new Map<string, number>();
        for (let i = 0; i < fastestLapsData.length; i++) {
          const teamName = driversData[i].teamName;

          if (teamsIndex.has(teamName)) {
            const teamIdx = teamsIndex.get(teamName)!;
            if (fastestLapsTeams[teamIdx].lapTime > fastestLapsData[i].lapTime) {
              fastestLapsTeams[teamIdx] = fastestLapsData[i];
            }
          } else {
            const newIdx = fastestLapsTeams.length;
            fastestLapsTeams.push(fastestLapsData[i]);
            teamsIndex.set(teamName, newIdx);
            teamsData.push(driversData[i]);
          }
        }

        // sets the bounds of graphs for the drivers
        let minDriversSpeeds = [];
        let minDriversSpeedBounds = new Bounds(999, 0);
        let maxDriversSpeeds = [];
        let maxDriversSpeedBounds = new Bounds(999, 0);
        let throttleDrivers = [];
        let throttleDriversBounds = new Bounds(999, 0);
        for (let i = 0; i < fastestLapsData.length; i++) {
          let minSpeed = { team: driversData[i].lastName.slice(0, 3).toUpperCase(), value: fastestLapsData[i].minSpeed, color: driversData[i].teamColour };
          minDriversSpeeds.push(minSpeed);
          if (minSpeed.value - 1 < minDriversSpeedBounds.minY) {
            minDriversSpeedBounds.minY = minSpeed.value - 1;
          }
          if (minSpeed.value + 1 > minDriversSpeedBounds.maxY) {
            minDriversSpeedBounds.maxY = minSpeed.value + 1;
          }

          let maxSpeed = { team: driversData[i].lastName.slice(0, 3).toUpperCase(), value: fastestLapsData[i].maxSpeed, color: driversData[i].teamColour };
          maxDriversSpeeds.push(maxSpeed);
          if (maxSpeed.value - 1 < maxDriversSpeedBounds.minY) {
            maxDriversSpeedBounds.minY = maxSpeed.value - 1;
          }
          if (maxSpeed.value + 1 > maxDriversSpeedBounds.maxY) {
            maxDriversSpeedBounds.maxY = maxSpeed.value + 1;
          }

          let throttle = { team: driversData[i].lastName.slice(0, 3).toUpperCase(), value: fastestLapsData[i].throttle * 100, color: driversData[i].teamColour };
          throttleDrivers.push(throttle);
          if (throttle.value - 1 < throttleDriversBounds.minY) {
            throttleDriversBounds.minY = throttle.value - 1;
          }
          if (throttle.value + 1 > throttleDriversBounds.maxY) {
            throttleDriversBounds.maxY = throttle.value + 1;
          }
        }

        // sets bounds of the graphs for the teams
        let minTeamsSpeeds = [];
        let minTeamsSpeedBounds = new Bounds(999, 0);
        let maxTeamsSpeeds = [];
        let maxTeamsSpeedBounds = new Bounds(999, 0);
        let throttleTeams = [];
        let throttleTeamsBounds = new Bounds(999, 0);
        for (let i = 0; i < fastestLapsTeams.length; i++) {
          let minSpeed = { team: teamsData[i].teamName, value: fastestLapsTeams[i].minSpeed, color: teamsData[i].teamColour };
          minTeamsSpeeds.push(minSpeed);
          if (minSpeed.value - 1 < minTeamsSpeedBounds.minY) {
            minTeamsSpeedBounds.minY = minSpeed.value - 1;
          }
          if (minSpeed.value + 1 > minTeamsSpeedBounds.maxY) {
            minTeamsSpeedBounds.maxY = minSpeed.value + 1;
          }

          let maxSpeed = { team: teamsData[i].teamName, value: fastestLapsTeams[i].maxSpeed, color: teamsData[i].teamColour };
          maxTeamsSpeeds.push(maxSpeed);
          if (maxSpeed.value - 1 < maxTeamsSpeedBounds.minY) {
            maxTeamsSpeedBounds.minY = maxSpeed.value - 1;
          }
          if (maxSpeed.value + 1 > maxTeamsSpeedBounds.maxY) {
            maxTeamsSpeedBounds.maxY = maxSpeed.value + 1;
          }

          let throttle = { team: teamsData[i].teamName, value: fastestLapsTeams[i].throttle * 100, color: teamsData[i].teamColour };
          throttleTeams.push(throttle);
          if (throttle.value - 1 < throttleTeamsBounds.minY) {
            throttleTeamsBounds.minY = throttle.value - 1;
          }
          if (throttle.value + 1 > throttleTeamsBounds.maxY) {
            throttleTeamsBounds.maxY = throttle.value + 1;
          }
        }

        // sorts data from highest to lowest values
        minDriversSpeeds.sort((a, b) => b.value - a.value);
        minTeamsSpeeds.sort((a, b) => b.value - a.value);
        maxDriversSpeeds.sort((a, b) => b.value - a.value);
        maxTeamsSpeeds.sort((a, b) => b.value - a.value);
        throttleDrivers.sort((a, b) => b.value - a.value);
        throttleTeams.sort((a, b) => b.value - a.value);


        // sets all data
        setMinSpeedDriverData(minDriversSpeeds);
        setMinSpeedDriverBounds(minDriversSpeedBounds);
        setMinSpeedTeamData(minTeamsSpeeds);
        setMinSpeedTeamBounds(minTeamsSpeedBounds);

        setMaxSpeedDriverData(maxDriversSpeeds);
        setMaxSpeedDriverBounds(maxDriversSpeedBounds);
        setMaxSpeedTeamData(maxTeamsSpeeds);
        setMaxSpeedTeamBounds(maxTeamsSpeedBounds);

        setThrottleDriverData(throttleDrivers);
        setThrottleDriverBounds(throttleDriversBounds);
        setThrottleTeamData(throttleTeams);
        setThrottleTeamBounds(throttleTeamsBounds);
      } catch (error) {
        console.error("Error fetching pit performance data:", error);
      }
    };

    fetchSpeeds();
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        color: "#E3E3E3",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          justifyContent: "center",
          alignItems: "center",
          mb: 2,
        }}
      >
        {/* teams vs drivers toggle selection */}
        <ToggleButtonGroup
          value={dataType}
          exclusive
          onChange={handleDataChange}
          sx={{
            mb: 1,
            border: "1px solid #AAAAAA",
            "& .MuiToggleButton-root": {
              border: "1px solid #AAAAAA",
              "&.Mui-selected": {
                border: "1px solid #AAAAAA",
              },
            },
          }}
        >
          <ToggleButton value="teams">Teams</ToggleButton>
          <ToggleButton value="drivers">Drivers</ToggleButton>
        </ToggleButtonGroup>

        {/* y-axis toggle selection */}
        <ToggleButtonGroup
          value={chartType}
          exclusive
          onChange={handleChartChange}
          sx={{
            mb: 1,
            border: "1px solid #AAAAAA",
            "& .MuiToggleButton-root": {
              border: "1px solid #AAAAAA",
              "&.Mui-selected": {
                border: "1px solid #AAAAAA",
              },
            },
          }}
        >
          <ToggleButton value="min">Min Speed</ToggleButton>
          <ToggleButton value="max">Max Speed</ToggleButton>
          <ToggleButton value="throttle">Throttle</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <ResponsiveContainer width="100%" height="100%">
        {
          minSpeedDrivers.length == 0 ? (
            // if no drivers then display loading data
            <Stack
              spacing={3}
              alignItems="center"
              justifyContent="center"
              sx={{ minHeight: "80vh" }}
            >
              <Box sx={{ width: '30%' }}>
                <LinearProgress color="inherit" />
              </Box>
              <Typography variant="h6" fontWeight="500" sx={{ color: "#E3E3E3" }}>
                Loading Data...
              </Typography>
            </Stack>
          )
            :
            // otherwise display the bar chart
            <BarChart
              data={
                dataType === "drivers" ? chartType === "min" ? minSpeedDrivers : chartType === "max" ? maxSpeedDrivers : throttleDrivers : chartType === "min" ? minSpeedTeams : chartType === "max" ? maxSpeedTeams : throttleTeams
              }
              margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="6 6" vertical={false} />
              <XAxis
                dataKey="team"
                fontFamily={exo2.style.fontFamily}
                fontSize={16}
                fontWeight="600"
                style={{ fill: "#E2E2E2" }}
                tickCount={0}
              />
              <YAxis
                fontFamily={exo2.style.fontFamily}
                fontSize={18}
                fontWeight="500"
                style={{ fill: "#E2E2E2" }}
                label={{
                  // changes label based on chart type
                  value: chartType == "min" ? "Min speed during fastest lap (kph)" : chartType == "max" ? "Max speed during fastest lap (kph)" : "Time with maximum throttle on (%)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontFamily: exo2.style.fontFamily, fontWeight: "600" },
                  fill: "#E2E2E2",
                  dy: 70,
                }}
                // sets the bounds (depending on y-axis and drivers/teams)
                domain={[
                  Math.floor(
                    (dataType === "drivers" ? chartType === "min" ? minSpeedDriverBounds : chartType === "max" ? maxSpeedDriverBounds : throttleDriverBounds : chartType === "min" ? minSpeedTeamBounds : chartType === "max" ? maxSpeedTeamBounds : throttleTeamBounds).minY
                  ),
                  Math.ceil(
                    (dataType === "drivers" ? chartType === "min" ? minSpeedDriverBounds : chartType === "max" ? maxSpeedDriverBounds : throttleDriverBounds : chartType === "min" ? minSpeedTeamBounds : chartType === "max" ? maxSpeedTeamBounds : throttleTeamBounds).maxY
                  ),
                ]}

                // shows which values on graph should be shown on axis
                ticks={(() => {
                  const bounds = dataType === "drivers" ? chartType === "min" ? minSpeedDriverBounds : chartType === "max" ? maxSpeedDriverBounds : throttleDriverBounds : chartType === "min" ? minSpeedTeamBounds : chartType === "max" ? maxSpeedTeamBounds : throttleTeamBounds;
                  const min = Math.floor(bounds.minY);
                  const max = Math.ceil(bounds.maxY);
                  const tickArray = [];
                  for (let i = min; i <= max; i++) {
                    tickArray.push(i);
                  }
                  return tickArray;
                })()}
                interval={0}
                // formats to int
                tickFormatter={(value) => value.toFixed(0)}
              />
              {/* displays bars */}
              <Bar dataKey="value" radius={[14, 14, 0, 0]}>
                {(dataType === "drivers" ? chartType === "min" ? minSpeedDrivers : chartType === "max" ? maxSpeedDrivers : throttleDrivers : chartType === "min" ? minSpeedTeams : chartType === "max" ? maxSpeedTeams : throttleTeams).map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(value: number) => chartType == "throttle" ? value.toFixed(1) + "%" : value.toFixed(0)}
                  fontFamily={exo2Regular.style.fontFamily}
                  fontWeight="600"
                  fontSize={24}
                />
              </Bar>
            </BarChart>
        }
      </ResponsiveContainer>
    </Box>
  );
};

export default SpeedsChart;