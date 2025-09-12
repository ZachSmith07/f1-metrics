"use client";

import React, { useState, useEffect } from "react";
import { Box, Typography, ThemeProvider, CssBaseline, ToggleButtonGroup, ToggleButton, Stack, LinearProgress } from "@mui/material";
import { LapData } from "../classes/lapData";
import { DriverData } from "../classes/driverData";
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

type PositionChangesProps = {
  laps: LapData[][];
  drivers: DriverData[];
};

interface DriverDataLegend {
  driverName: string;
  teamColour: string;
  isDashed: boolean;
}


const PositionChanges: React.FC<PositionChangesProps> = ({ laps, drivers }) => {

  // defines data for DriverLegend
  const calculateDriverLegend = () => {
    let legend: DriverDataLegend[] = [];
    for (let i = 0; i < drivers.length; i++) {
      legend.push({ driverName: drivers[i].lastName, teamColour: drivers[i].teamColour, isDashed: legend.map((x) => x.teamColour).includes(drivers[i].teamColour) });
    }
    return legend;
  }
  const driverLegend: DriverDataLegend[] = calculateDriverLegend();

  const chartData: any[] = [];
  // finds how many laps there are (by finding the drivers with the most laps)
  const maxLaps = Math.max(...laps.map((driverLaps) => driverLaps.length));

  // sets chart data
  for (let lapIndex = 0; lapIndex < maxLaps; lapIndex++) {
    const lapEntry: any = { lapNum: lapIndex + 1 };
    laps.forEach((driverLaps, driverIndex) => {
      const lapData = driverLaps[lapIndex];
      if (lapData) {
        const driverName = drivers[driverIndex].lastName;
        if (lapData.position != -1) {
          lapEntry[driverName] = lapData.position;
        }
      }
    });
    chartData.push(lapEntry);
  }

  // defines the tooltip (drivers from P1 - P20 named)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // sort by position (ascending)
      const sortedPayload = [...payload].sort((a, b) => a.value - b.value);

      return (
        <div
          style={{
            backgroundColor: "#444444",
            padding: "10px",
            borderRadius: "10px",
            color: "#ffffff",
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          }}
        >
          <p style={{ marginBottom: "6px" }}>Lap {label}</p>
          {sortedPayload.map((entry: any, index: number) => (
            <div key={index}>
              <span
                style={{
                  color: entry.stroke,
                  fontWeight: 600,
                }}
              >
                {entry.name}:
              </span>{" "}
              P{entry.value}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };


  return (
    // displays line chart
    <ResponsiveContainer width="100%" height={"100%"}>
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        {/* defines axis labels and names */}
        <XAxis dataKey="lapNum" label={{ value: "Lap Number", position: "insideBottom", offset: 6, fill: 'white' }} height={45} tick={{ fill: 'white' }} />
        <YAxis reversed={true} tick={{ fill: 'white' }} tickFormatter={(value) => { return `${value}) ${drivers[value - 1] == undefined ? "undefined" : drivers[value - 1].lastName}` }} width={110} domain={[1, laps.length]} tickCount={laps.length} orientation="right" />
        {/* sets the custom tooltip */}
        <Tooltip content={<CustomTooltip />} />
        {/* displays legend */}
        <Legend
          formatter={(value: string) => {
            const legendItem = driverLegend.find((d) => d.driverName === value);
            return (
              <span>
                {value}
                {legendItem?.isDashed && " (dashed)"}
              </span>
            );
          }}
        />
        {/* displays all lines */}
        {driverLegend.map((driver, index) => (
          <Line
            key={index}
            type="monotone"
            dataKey={driver.driverName}
            stroke={driver.teamColour}
            strokeDasharray={driver.isDashed ? "5 5" : "0"}
            dot={false}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PositionChanges;