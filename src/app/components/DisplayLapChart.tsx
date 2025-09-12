import React, { useEffect, useState } from "react";
import { LapData } from "../classes/lapData";
import { DriverData } from "../classes/driverData";
import {
    LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
    CartesianGrid,
    Tooltip
} from 'recharts';
import { Box, Button, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { formatLapTime } from "../utils/formatting";

type Compound = "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET" | "UNKNOWN";

type Stint = {
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
    lapsData: LapData[][];
    driversData: DriverData[];
};

interface DriverLapDataSingle {
    driver: DriverData;
    lap: LapData;
}

interface DriverLapData {
    driver: DriverData;
    laps: LapData[];
}

interface DriverDataLegend {
    driverName: string;
    teamColour: string;
    isDashed: boolean;
    position: number;
}


// displays the lap chart and options
const LapChartGraph: React.FC<TyreStrategyChartProps> = ({ lapsData, driversData }) => {
    const compoundColours: { [key: string]: string } = {
        "SOFT": "#ff4c4c",
        "MEDIUM": "#f5e356",
        "HARD": "#ffffff",
        "INTERMEDIATE": "#3cb371",
        "WET": "#1e90ff",
        "UNKNOWN": "000000"
    };

    const [lineDataLapNumber, setLineDataLapNumber] = useState<DriverLapData[]>([]);
    const [lineDataTyreAge, setLineDataTyreAge] = useState<DriverLapData[]>([]);

    // defines chart boundaries
    const [minLapTime, setMinLapTime] = useState<number>(90);
    const [maxLapTime, setMaxLapTime] = useState<number>(100);
    const [minLapNumber, setMinLapNumber] = useState<number>(1);
    const [maxLapNumber, setMaxLapNumber] = useState<number>(78);
    const [minTyreAge, setMinTyreAge] = useState<number>(1);
    const [maxTyreAge, setMaxTyreAge] = useState<number>(78);

    // defines types of x-axis
    const [xAxisType, setXAxisType] = useState<"lap number" | "tyre age">(() => {
        return (sessionStorage.getItem("xAxisType") as "lap number" | "tyre age") || "tyre age";
    });
    useEffect(() => {
        sessionStorage.setItem("xAxisType", xAxisType);
    }, [xAxisType]);

    const [dotsShown, setDotsShown] = useState<"all" | "some" | "none">(() => {
        return (sessionStorage.getItem("dotsShown") as "all" | "some" | "none") || "all";
    });
    useEffect(() => {
        sessionStorage.setItem("dotsShown", dotsShown);
    }, [dotsShown]);

    const [driverDataLegend, setDriverDataLegend] = useState<DriverDataLegend[]>([]);

    const [graphKey, setGraphKey] = useState<number>(0);


    const handleXAxisChange = (_event: React.MouseEvent<HTMLElement>, newValue: "lap number" | "tyre age") => {
        if (newValue !== null) setXAxisType(newValue);
    };
    const handleDotsChange = (_event: React.MouseEvent<HTMLElement>, newValue: "all" | "some" | "none") => {
        if (newValue !== null) setDotsShown(newValue);
    };


    const setLaps = () => {
        let lineLapNumberData: DriverLapData[] = [];
        let lineTyreAgeData: DriverLapData[] = [];

        let legendData: DriverDataLegend[] = [];

        let minLapTime = 999;
        let maxLapTime = 0;

        let minLapNumber = 999;
        let maxLapNumber = 0;
        let minTyreAge = 999;
        let maxTyreAge = 0;

        // finds min and max lap times (as well as lap number and tyre age)
        for (let i = 0; i < lapsData.length; i++) {
            let currentDriverLapData: DriverLapData = { driver: driversData[i], laps: [] };
            let currentDriverLapNumberData: DriverLapData = { driver: driversData[i], laps: [] };
            for (let j = 0; j < lapsData[i].length; j++) {
                if (j > 0) {
                    if (lapsData[i][j].stint != lapsData[i][j - 1].stint) {
                        if (currentDriverLapData.laps.length != 0) {
                            lineTyreAgeData.push(currentDriverLapData);
                            currentDriverLapData = { driver: driversData[i], laps: [] };
                        }
                    }
                }
                if (lapsData[i][j].isChecked) {
                    currentDriverLapData.laps.push(lapsData[i][j]);
                    currentDriverLapNumberData.laps.push(lapsData[i][j]);
                    if (maxLapTime < lapsData[i][j].lapTime) {
                        maxLapTime = lapsData[i][j].lapTime;
                    }
                    if (minLapTime > lapsData[i][j].lapTime) {
                        minLapTime = lapsData[i][j].lapTime;
                    }

                    if (maxLapNumber < lapsData[i][j].lapNumber) {
                        maxLapNumber = lapsData[i][j].lapNumber;
                    }
                    if (minLapNumber > lapsData[i][j].lapNumber) {
                        minLapNumber = lapsData[i][j].lapNumber;
                    }

                    if (maxTyreAge < lapsData[i][j].tyreLife) {
                        maxTyreAge = lapsData[i][j].tyreLife;
                    }
                    if (minTyreAge > lapsData[i][j].tyreLife) {
                        minTyreAge = lapsData[i][j].tyreLife;
                    }
                }
            }
            if (currentDriverLapData.laps.length != 0) {
                lineTyreAgeData.push(currentDriverLapData);
            }
            if (currentDriverLapNumberData.laps.length != 0) {
                lineLapNumberData.push(currentDriverLapNumberData);

                legendData.push({ driverName: driversData[i].firstName + " " + driversData[i].lastName, teamColour: driversData[i].teamColour, isDashed: legendData.map((x) => x.teamColour).includes(driversData[i].teamColour), position: driversData[i].position });
            }
        }

        console.log(lineTyreAgeData);
        console.log(lineLapNumberData);

        // sets all variables for rendering

        setLineDataLapNumber(lineLapNumberData);
        setLineDataTyreAge(lineTyreAgeData);
        setDriverDataLegend(legendData);

        minLapTime = Math.floor(minLapTime);
        maxLapTime = Math.ceil(maxLapTime);

        setMinLapTime(minLapTime);
        setMaxLapTime(maxLapTime);
        setMinLapNumber(minLapNumber);
        setMaxLapNumber(maxLapNumber);
        setMinTyreAge(minTyreAge);
        setMaxTyreAge(maxTyreAge);
    };

    useEffect(() => {
        setLaps();
    }, []);

    // defines tooltip for the laps
    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: number }) => {
        if (active && payload && payload.length && label) {
            console.log(label);
            // finds the laps
            let lapDatas: DriverLapDataSingle[] = [];
            for (let i = 0; i < lineDataLapNumber.length; i++) {
                for (let j = 0; j < lineDataLapNumber[i].laps.length; j++) {
                    if ((xAxisType == "lap number" ? lineDataLapNumber[i].laps[j].lapNumber : lineDataLapNumber[i].laps[j].tyreLife) == label) {
                        lapDatas.push({ driver: lineDataLapNumber[i].driver, lap: lineDataLapNumber[i].laps[j] });
                    }
                }
            }

            // returns the tooltip
            return (
                <div style={{
                    background: "#333", // Dark grey background
                    color: "#fff", // White text for contrast
                    padding: "10px",
                    border: "1px solid #555",
                    borderRadius: "5px",
                    boxShadow: "0px 0px 5px rgba(0,0,0,0.4)"
                }}>
                    <p style={{ fontWeight: "bold", marginBottom: "5px" }}>{xAxisType == "lap number" ? "Lap" : "Tyre Age:"} {label}</p> {/* Shows hovered lap number */}
                    {/* goes through each lap hovered over */}
                    {lapDatas.map((entry, index) => {
                        return (
                            <div key={index} style={{ marginBottom: "5px" }}>
                                <p style={{ fontWeight: "bold", color: `${entry.driver.teamColour}`, margin: 0 }}>
                                    {entry.driver.lastName}
                                </p>
                                <p style={{ margin: "2px 0" }}>Lap Time: {formatLapTime(entry.lap.lapTime)}</p>
                                <p style={{ margin: "2px 0" }}>
                                    Tyre: <span style={{ color: compoundColours[entry.lap.compound], fontWeight: "600" }}>{entry.lap.compound}{xAxisType == "lap number" ? ` (${entry.lap.tyreLife})` : ""}</span>
                                </p>
                            </div>
                        );
                    })}
                </div>
            );
        }
        return null;
    };


    // defines columns of the legend - that contains driver info
    const legendColumns: GridColDef[] = [
        {
            field: "driverName",
            headerName: 'Driver Name',
            width: 160,
            disableColumnMenu: true,
            resizable: false,
        },
        {
            field: "teamColour",
            headerName: "Legend",
            width: 109,
            sortable: false,
            disableColumnMenu: true,
            resizable: false,
            renderCell: (params: { row: { driverName: string; teamColour: any; isDashed: any; }; }) => (
                // renders a clickable line - which toggles from dashed to un-dashed
                <Button onClick={
                    (event) => {
                        let newDriverData = [...driverDataLegend];
                        for (let i = 0; i < newDriverData.length; i++) {
                            if (newDriverData[i].driverName == params.row.driverName) {
                                newDriverData[i].isDashed = !newDriverData[i].isDashed;
                            }
                        }
                        setDriverDataLegend(newDriverData);
                        setGraphKey(graphKey + 1);
                    }
                }>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'start', height: '100%' }}>
                        <svg width="70" height="6">
                            <line
                                x1="0"
                                y1="3"
                                x2="85"
                                y2="3"
                                stroke={params.row.teamColour || 'green'}
                                strokeWidth="4" // Line width
                                strokeDasharray={params.row.isDashed ? "5,5" : "0"}
                            />
                        </svg>
                    </div>
                </Button>
            ),
        },
    ];


    return (
        lineDataLapNumber.length == 0 ?
            // default text if no lap selected
            <Typography>
                Click any of the stints below to display it on a chart, you will be given a quick preview of the laps if you hover over any stint. Or if you want to have more control over which laps are displayed, you can click on custom to choose each lap specifically.
            </Typography>
            :
            // if at least one lap selected, displays the lap chart
            <Box display="flex" flexDirection="column" height="100%">
                <Box flexDirection={"row"} display={"flex"} justifyContent={"space-around"} alignItems={"center"} mb={2} >

                    {/* displays x and y-axis choices */}
                    <Box flexDirection={"column"}>
                        <Box flexDirection={"row"} display={"flex"} alignItems={"center"} gap={2}>
                            <Typography variant="body1" marginBottom={1.1}>X Axis:</Typography>
                            <ToggleButtonGroup
                                value={xAxisType}
                                exclusive
                                onChange={handleXAxisChange}
                                size={"small"}
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
                                <ToggleButton value="lap number">Lap Number</ToggleButton>
                                <ToggleButton value="tyre age">Tyre Age</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                        <Box flexDirection={"row"} display={"flex"} alignItems={"center"} gap={2}>
                            <Typography variant="body1" marginBottom={1.1}>Dots Shown:</Typography>
                            <ToggleButtonGroup
                                value={dotsShown}
                                exclusive
                                onChange={handleDotsChange}
                                size={"small"}
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
                                <ToggleButton value="all">All</ToggleButton>
                                <ToggleButton value="some">Some</ToggleButton>
                                <ToggleButton value="none">None</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    </Box>

                    {/* displays driver legend table */}
                    <Box width={270}>
                        <DataGrid
                            style={{ width: 270 }}
                            rows={driverDataLegend.map((row, index) => ({ ...row, id: index }))}
                            columns={legendColumns}
                            disableRowSelectionOnClick
                            rowHeight={40}
                            autoHeight
                            hideFooter={true}
                            sx={{ flexShrink: 0 }}
                        />
                    </Box>
                </Box>
                <Box flexGrow={1} height="0" minHeight={0}>
                    {/* actual line chart */}
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart key={graphKey}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" dataKey={xAxisType == "lap number" ? "lapNumber" : "tyreLife"} domain={xAxisType == "lap number" ? [minLapNumber - 1, maxLapNumber + 1] : [minTyreAge - 1, maxTyreAge + 1]} tickCount={xAxisType == "lap number" ? maxLapNumber - minLapNumber + 3 : maxTyreAge - minTyreAge + 3} tick={{ fill: 'white' }} />
                            <YAxis domain={[minLapTime, maxLapTime]} tickCount={maxLapTime - minLapTime + 1} tickFormatter={(value) => formatLapTime(value)} tick={{ fill: 'white' }} width={70} />
                            {<Tooltip content={<CustomTooltip />} />}
                            {
                                xAxisType == "lap number" ?
                                    // displays x-axis lap number chart
                                    lineDataLapNumber.map((driverData) => (
                                        <Line
                                            key={driverData.driver.lastName + driverData.laps[0].lapNumber.toString()}
                                            name={driverData.driver.lastName}
                                            type="linear"
                                            data={driverData.laps}
                                            dataKey={"lapTime"}
                                            stroke={driverData.driver.teamColour}
                                            strokeWidth={3}
                                            strokeDasharray={driverDataLegend[driverDataLegend.map((x) => x.driverName).indexOf(driverData.driver.firstName + " " + driverData.driver.lastName)].isDashed ? "8, 8" : "0"}
                                            dot={(props) => {
                                                const { cx, cy, payload } = props;
                                                const compound = payload.compound as string;

                                                // defines the tyre colour (which fills the circle)
                                                const fillColor = Object.keys(compoundColours).includes(compound)
                                                    ? compoundColours[compound]
                                                    : "#FFFFFF";
                                                const lapIndex = driverData.laps.map((x) => x.lapNumber).indexOf(payload.lapNumber);

                                                // checks if the first dot (for whether they should show the dot under certain settings)
                                                let isFirst = false;
                                                if (lapIndex == 0) {
                                                    isFirst = true;
                                                }
                                                else {
                                                    if (driverData.laps[lapIndex - 1].stint != driverData.laps[lapIndex].stint) {
                                                        isFirst = true;
                                                    }
                                                }

                                                return (
                                                    <circle
                                                        key={`${driverData.driver.lastName}-${payload.lapNumber}`}
                                                        cx={cx}
                                                        cy={cy}
                                                        r={dotsShown == "all" ? 8 : dotsShown == "some" ? isFirst ? 8 : 0 : 0}
                                                        stroke={driverData.driver.teamColour}
                                                        strokeWidth={3}
                                                        fill={fillColor}
                                                    />
                                                );
                                            }}
                                            activeDot={{
                                                r: 0
                                            }}
                                        />
                                    )
                                    )
                                    :
                                    // displays x-axis tyre age chart
                                    lineDataTyreAge.map((driverData) => (
                                        <Line
                                            key={driverData.driver.lastName + driverData.laps[0].lapNumber.toString()}
                                            name={driverData.driver.lastName}
                                            type="linear"
                                            data={driverData.laps}
                                            dataKey={"lapTime"}
                                            stroke={driverData.driver.teamColour}
                                            strokeWidth={3}
                                            strokeDasharray={driverDataLegend[driverDataLegend.map((x) => x.driverName).indexOf(driverData.driver.firstName + " " + driverData.driver.lastName)].isDashed ? "8, 8" : "0"}
                                            dot={(props) => {
                                                const { cx, cy, payload } = props;
                                                const compound = payload.compound as string;
                                                const fillColor = Object.keys(compoundColours).includes(compound)
                                                    ? compoundColours[compound]
                                                    : "#FFFFFF";
                                                const lapIndex = driverData.laps.map((x) => x.lapNumber).indexOf(payload.lapNumber);
                                                let isFirst = false;
                                                if (lapIndex == 0) {
                                                    isFirst = true;
                                                }
                                                else {
                                                    if (driverData.laps[lapIndex - 1].stint != driverData.laps[lapIndex].stint) {
                                                        isFirst = true;
                                                    }
                                                }

                                                return (
                                                    <circle
                                                        key={`${driverData.driver.lastName}-${payload.lapNumber}`}
                                                        cx={cx}
                                                        cy={cy}
                                                        r={dotsShown == "all" ? 8 : dotsShown == "some" ? isFirst ? 8 : 0 : 0}
                                                        stroke={driverData.driver.teamColour}
                                                        strokeWidth={3}
                                                        fill={fillColor}
                                                    />
                                                );
                                            }}
                                            activeDot={{
                                                r: 0
                                            }}
                                        />
                                    )
                                    )
                            }
                        </LineChart>
                    </ResponsiveContainer>

                </Box>
            </Box>
    );
};

export default LapChartGraph;