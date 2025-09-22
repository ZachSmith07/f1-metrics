import React, { useEffect, useState } from "react";
import { LapData } from "../classes/lapData";
import { DriverData } from "../classes/driverData";
import {
	LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { Box, Typography } from "@mui/material";
import { createPortal } from "react-dom";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { Check } from '@mui/icons-material';
import { formatLapTime } from "../utils/formatting";

type LapTimePoint = {
	lap: number;
	time: number;
};

// calculates regression line for tooltip
function getRegressionLine(data: LapTimePoint[]): LapTimePoint[] {
	const n = data.length;
	const sumX = data.reduce((sum, d) => sum + d.lap, 0);
	const sumY = data.reduce((sum, d) => sum + d.time, 0);
	const sumXY = data.reduce((sum, d) => sum + d.lap * d.time, 0);
	const sumX2 = data.reduce((sum, d) => sum + d.lap * d.lap, 0);

	const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
	const intercept = (sumY - slope * sumX) / n;

	return data.map(d => ({
		lap: d.lap,
		time: slope * d.lap + intercept,
	}));
}

type MiniChartProps = {
	data: LapTimePoint[];
	driver: DriverData | undefined
};

// displays mini chart with regression line and lap data points
const MiniChart: React.FC<MiniChartProps> = ({ data, driver }) => {
	const regression = getRegressionLine(data);

	// finds bounds
	const minLap = Math.min(...data.map((x) => x.time)) - 0.05;
	const maxLap = Math.max(...data.map((x) => x.time)) + 0.05;

	return (
		<div style={{ width: 340, height: 200 }}>
			<ResponsiveContainer>
				<LineChart data={data}>
					<XAxis dataKey="lap" hide />
					<YAxis hide domain={[minLap, maxLap]} />
					<Line
						type="monotone"
						dataKey="time"
						stroke={driver == undefined ? "#FFFFFF" : driver.teamColour}
						strokeWidth={2}
						dot={false}
					/>
					<Line
						type="monotone"
						data={regression}
						dataKey="time"
						stroke={driver == undefined ? "#FFFFFF" : driver.teamColour}
						strokeWidth={2}
						dot={false}
						strokeDasharray="4 4"
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
};

type Compound = "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET" | "UNKNOWN";

interface Stint {
	compound: Compound;
	startLap: number;
	endLap: number;
};

export type DriverStrategy = {
	driver: string;
	stints: Stint[];
	driverData: DriverData;
};

type TyreStrategyChartProps = {
	laps: LapData[][];
	drivers: DriverData[];
	clickable: boolean;
	onClick: (driverLaps: LapData[], index: number, add: boolean) => void;
};

function toCompound(input: string): Compound {
	const compounds: Compound[] = ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"];
	return compounds.includes(input as Compound) ? (input as Compound) : "UNKNOWN";
}

// calculates each drivers strategy from a list of laps
const calculateStrategies = (laps: LapData[][], drivers: DriverData[]): DriverStrategy[] => {
	let strategies: DriverStrategy[] = [];
	// each driver
	for (let i = 0; i < laps.length; i++) {
		// sets default values
		let currentStint = 1;
		let tyre: Compound = "SOFT";
		let driverStints: Stint[] = [];
		let startLap = 1;
		// each lap
		for (let j = 0; j < laps[i].length; j++) {
			// if still same stint as last lap
			if (laps[i][j].stint == currentStint) {
				tyre = toCompound(laps[i][j].compound);
			}
			else {
				// if not then adds to driver's stints, and changes the data for the next stint
				driverStints.push({ compound: tyre, startLap: startLap, endLap: j });
				startLap = laps[i][j].lapNumber;
				currentStint = laps[i][j].stint;
				tyre = toCompound(laps[i][j].compound);
			}
		}
		// if there are any laps in the current stint, it adds to the stints list
		if (laps[i].length > 0) {
			driverStints.push({ compound: tyre, startLap: startLap, endLap: laps[i].length + 1 });
		}
		// adds the data to the strategies
		strategies.push({ driver: drivers[i].lastName, stints: driverStints, driverData: drivers[i] });
	}
	return strategies;
};

const compoundColors: Record<Compound, string> = {
	SOFT: "#ff4c4c",
	MEDIUM: "#f5e356",
	HARD: "#ffffff",
	INTERMEDIATE: "#3cb371",
	WET: "#1e90ff",
	UNKNOWN: "#000000"
};



const TyreStrategyChart: React.FC<TyreStrategyChartProps> = ({ laps, drivers, clickable, onClick }) => {
	// contains driver strategy
	const [strategies, setStrategies] = useState<DriverStrategy[]>([]);

	// finds total number of laps
	const TOTAL_LAPS = Math.max(...laps.map((x) => x.length));

	// contains data of which stint has been added (for lap times screen - choosing each stint)
	const [stintAdded, setStintAdded] = useState<boolean[][]>([]);

	// calculates driver strategy
	useEffect(() => {
		let strats = calculateStrategies(laps, drivers);
		// sets which stint has been added
		let stintAdded: boolean[][] = [];
		for (let i = 0; i < strats.length; i++) {
			stintAdded.push([]);
			for (let j = 0; j < strats[i].stints.length; j++) {
				let selected: boolean = false;
				for (let k = strats[i].stints[j].startLap - 1; k < strats[i].stints[j].endLap - 1; k++) {
					if (laps[i][k].isChecked == true) {
						selected = true;
						break;
					}
				}
				stintAdded[i].push(selected);
			}
		}
		setStintAdded(stintAdded);
		console.log(stintAdded);
		setStrategies(strats);
	}, []);

	// sets tooltip data
	const [tooltip, setTooltip] = useState<{
		visible: boolean;
		content: string;
		x: number;
		y: number;
		data: [number, number][]
		driver: DriverData | undefined
	}>({
		visible: false,
		content: "",
		x: 0,
		y: 0,
		data: [],
		driver: undefined
	});

	// when mouse clicks on an element, it sets up the tooltip
	const handleMouseEnter = (
		e: React.MouseEvent<HTMLDivElement>,
		compound: string,
		startLap: number,
		endLap: number,
		idx: number,
	) => {
		let lapTimes: [number, number][] = [];
		for (let i = startLap - 1; i < endLap - 1; i++) {
			if (laps[idx][i].isAccurate) {
				lapTimes.push([i + 1, laps[idx][i].lapTime]);
			}
		}
		setTooltip({
			visible: true,
			content: `${compound}: Laps ${startLap}-${endLap} (${endLap - startLap + 1} laps)\nAverage Lap - ${formatLapTime(lapTimes.reduce((sum, [_, time]) => sum + time, 0) / lapTimes.length)}`,
			x: e.clientX + 10,
			y: e.clientY + 10,
			data: lapTimes,
			driver: drivers[idx]
		});
	};

	// moves the tooltip when the mouse moves
	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const tooltipWidth = 340;
		const tooltipHeight = 270;
		const padding = 10;

		setTooltip((prev) => {
			const willOverflowRight = e.clientX + tooltipWidth + padding > window.innerWidth;
			const willOverflowBottom = e.clientY + tooltipHeight + padding > window.innerHeight;

			const x = willOverflowRight
				? e.clientX - tooltipWidth - padding
				: e.clientX + padding;

			const y = willOverflowBottom
				? e.clientY - tooltipHeight - padding
				: e.clientY + padding;

			return {
				...prev,
				x,
				y,
			};
		});
	};

	// removes tooltip when the mouse leaves the stint
	const handleMouseLeave = () => {
		setTooltip({ visible: false, content: "", x: 0, y: 0, data: [], driver: undefined });
	};

	// displays strategues
	return (
		<Box>
			<div className="space-y-4 relative">
				{/* goes through each driver */}
				{strategies.map(({ driver, stints }, driverIdx) => {
					const position = `P${driverIdx + 1}`; // driver's position (P1, P2, etc.)
					return (
						<div key={driver} className="flex items-center">
							{/* driver position text - with fixed width (so all align) */}
							<div className="font-medium" style={{ width: '135px' }}>
								<span style={{ marginRight: "5px" }} className="font-bold text-lg">{position}</span> {driver}
							</div>
							{/* tyre strategy bars */}
							<div className="relative h-6 rounded overflow-hidden flex-1">
								{stints.map(({ compound, startLap, endLap }, idx) => {
									// calculates width of each stint
									const width = ((endLap - startLap + 1) / TOTAL_LAPS) * 100;
									// calculates starting position
									const left = (startLap / TOTAL_LAPS) * 100;

									// checks rounding on edges based on whether is first or last stint
									const isFirst = idx === 0;
									const isLast = idx === stints.length - 1;
									const roundedClasses = [
										isFirst && "rounded-l-md",
										isLast && "rounded-r-md",
									]
										.filter(Boolean)
										.join(" ");

									// displays the bars
									return (
										<div
											key={idx}
											className={`absolute top-0 h-full cursor-pointer ${roundedClasses} group`}
											style={{
												width: `${width}%`,
												left: `${left}%`,
												backgroundColor: compoundColors[compound],
												borderRight: "1px solid #000",
											}}
											// handles mouse events
											onMouseEnter={(e) =>
												handleMouseEnter(e, compound, startLap, endLap, driverIdx)
											}
											onMouseMove={handleMouseMove}
											onMouseLeave={handleMouseLeave}

											// on click, if is clickable will add the laps
											onClick={(event) => {
												if (clickable) {
													let lapsPush: LapData[] = [];
													for (let i = startLap - 1; i < endLap - 1; i++) {
														if (laps[driverIdx][i].isAccurate) {
															lapsPush.push(laps[driverIdx][i]);
														}
													}
													const minLapTime = Math.min(
														...lapsPush.map(lap => lap.lapTime === -1 ? 9999 : lap.lapTime)
													);
													for (let i = lapsPush.length - 1; i > -1; i--) {
														if (lapsPush[i].lapTime > minLapTime * 1.06) {
															lapsPush.splice(i, 1);
														}
													}

													console.log(driverIdx);
													console.log(idx);
													console.log(stintAdded);
													onClick(
														lapsPush,
														driverIdx,
														!stintAdded[driverIdx][idx]
													);
													let newStint: boolean[][] = [...stintAdded];
													newStint[driverIdx][idx] = !newStint[driverIdx][idx];
													setStintAdded(newStint);
												}
											}}
										>

											{/* if selected displays a tick */}
											{clickable && stintAdded[driverIdx][idx] && (
												<Check
													sx={{
														fontSize: 20,
														color: "#00AA00",
														position: "absolute",
														top: "50%",
														left: "50%",
														transform: "translate(-50%, -50%)",
														strokeWidth: 1.5,  // Adjust this value to make the tick thicker
														stroke: "#00AA00",  // Make sure the stroke color matches the fill color
													}}
												/>
											)}

											{/* if clickable and overed displays a button to either remove or show the stint */}
											{clickable && (
												<div className="hidden group-hover:flex items-center justify-center absolute inset-0 pointer-events-none">
													{/* Show RemoveCircle icon if selected, AddCircle otherwise */}
													{!stintAdded[driverIdx][idx] ? (
														<AddCircleIcon
															sx={{
																fontSize: 20,
																color: "white",
																filter: "drop-shadow(0 0 2px black)",
															}}
														/>
													) : (
														<RemoveCircleIcon
															sx={{
																fontSize: 20,
																color: "white",
																filter: "drop-shadow(0 0 2px black)",
															}}
														/>
													)}
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
					);
				})}
			</div>

			{/* displays the tooltip */}
			{tooltip.visible &&
				createPortal(
					<div
						style={{
							position: "fixed",
							zIndex: 50,
							padding: "10px",
							backgroundColor: "#303030",
							color: "white",
							fontSize: "0.875rem",
							borderRadius: "1rem",
							pointerEvents: "none",
							top: tooltip.y,
							left: tooltip.x,
							textAlign: "center",
						}}
					>
						<Typography>{tooltip.content.split("\n")[0]}</Typography>
						<Typography>{tooltip.content.split("\n")[1]}</Typography>
						<MiniChart
							data={tooltip.data.map(([lap, time]: [number, number]) => ({ lap, time }))}
							driver={tooltip.driver}
						/>
					</div>,
					document.body
				)
			}

		</Box>
	);
};

export default TyreStrategyChart;