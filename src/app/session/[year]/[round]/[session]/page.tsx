"use client";

import { useEffect, useState } from "react";
import darkTheme from "../../../../theme";
import { CssBaseline, ThemeProvider, Stack, Typography, Box, ToggleButtonGroup, ToggleButton } from "@mui/material";
import Navbar from "../../../../components/Navbar";
import { useParams } from "next/navigation";
import { fetchPracticeResult, fetchQualiResult, fetchRaceResult, PracticeResult, QualiResult, RaceResult } from "@/app/utils/fetchResults";
import { PracticeResultsTable, QualiResultsTable, RaceResultsTable } from "@/app/components/DisplayResults";
import { LapData } from "@/app/classes/lapData";
import { fetchSessionData } from "@/app/utils/fetchSessionData";
import { DriverData } from "@/app/classes/driverData";
import TyreStrategyChart, { DriverStrategy } from "@/app/components/StrategyWidget";
import PitPerformanceChart from "@/app/components/PitPerformance";
import LapChart from "@/app/components/LapChart";
import SpeedsChart from "@/app/components/MaxSpeeds";
import PositionChanges from "@/app/components/PositionChanges";
import SpeedDistance from "@/app/components/SpeedDistance";
import { getMetadata, getStorage, ref } from "firebase/storage";

export default function SessionDash() {
    const [selection, setSelection] = useState("results");

    const [lapsData, setLapsData] = useState<LapData[][]>([[]]);
    const [driverData, setDriverData] = useState<DriverData[]>([]);
    const [drivers, setDrivers] = useState<string[]>([]);

    const [availableSessions, setAvailableSessions] = useState<string[]>(["Practice 1", "Practice 2", "Practice 3", "Qualifying", "Race"]);



    const params = useParams();
    const year = params.year as string;
    const round = decodeURIComponent(params.round as string);
    const session = decodeURIComponent(params.session as string);


    const [results, setResults] = useState<(any)[]>([]);

    const fileExists = async (path: string): Promise<boolean> => {
        const storage = getStorage();
        const fileRef = ref(storage, path);

        try {
            await getMetadata(fileRef);
            return true; // File exists
        } catch (error: any) {
            if (error.code === 'storage/object-not-found') {
                return false; // File does not exist
            }
            throw error; // Unexpected error
        }
    };

    useEffect(() => {
        const setSessions = async () => {

            if (await fileExists(`F1DataN/${year}/${round}/Sprint/results.json`))
            {
                setAvailableSessions(["Practice 1", "Sprint Qualifying", "Sprint", "Qualifying", "Race"]);
            }
        }
        setSessions();
    }, []);


    const handleChange = (_: React.MouseEvent<HTMLElement>, newSelection: string | null) => {
        if (newSelection !== null) {
            setSelection(newSelection);
        }
    };

    const fetchResults = async () => {
        let res = [];
        if (session == "Race" || session == "Sprint") {
            const results: RaceResult[] = await fetchRaceResult(year, round, session);
            console.log(results);
            res = results;
            setResults(results);
        }
        else if (session == "Qualifying" || session == "Sprint Qualifying" || session == "Sprint Shootout") {
            const results: QualiResult[] = await fetchQualiResult(year, round, session);
            console.log(results);
            res = results;
            setResults(results);
        }
        else {
            const results: PracticeResult[] = await fetchPracticeResult(year, round, session);
            console.log(results);
            res = results;
            setResults(results);
        }

        fetchLaps(res);
    }

    const fetchLaps = async (results: any[]) => {
        let data = await fetchSessionData(year, round, session);

        let lapsOld = data.allLapsData;
        let driverDataOld = data.driversData;
        let driversOld = data.driverIds;

        let newLaps = [];
        let newDriverData = [];
        let newDrivers = [];

        for (let i = 0; i < results.length; i++) {
            for (let j = 0; j < driverDataOld.length; j++) {
                if (driverDataOld[j].firstName + " " + driverDataOld[j].lastName == results[i].name) {
                    newLaps.push(lapsOld[j]);
                    newDriverData.push(driverDataOld[j]);
                    newDrivers.push(driversOld[j]);
                    break;
                }
            }
        }

        console.log(results);
        console.log("RESULTS");

        setLapsData(newLaps);
        setDriverData(newDriverData);
        setDrivers(newDrivers);

        console.log(data);
    }

    useEffect(() => {
        fetchResults();
    }, []);

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Navbar />
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" mt="20px">
                <ToggleButtonGroup
                    value={selection}
                    exclusive
                    onChange={handleChange}
                    size="small"
                    sx={{
                        // container styling
                        p: 0.5,
                        gap: 0.5,
                        borderRadius: 3,
                        background: 'rgba(40,40,40,0.6)',       // glassy dark
                        backdropFilter: 'blur(6px)',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                        flexWrap: 'wrap',
                    }}
                >
                    {[
                        { label: 'Results', value: 'results' },
                        { label: 'Strategy', value: 'strategy' },
                        ...(session === 'Race' || session === 'Sprint'
                            ? [{ label: 'Position Changes', value: 'positions' }]
                            : []),
                        { label: 'Lap Times', value: 'laptimes' },
                        ...(session === 'Race'
                            ? [{ label: 'Pit Performance', value: 'pitperformance' }]
                            : []),
                        { label: 'Min/Max Speed', value: 'maxspeed' },
                        { label: 'Telemetry Comparison', value: 'telemetry' },
                    ].map(({ label, value }) => (
                        <ToggleButton
                            key={value}
                            value={value}
                            disableRipple
                            sx={{
                                textTransform: 'none',
                                px: 2.5,
                                py: 1.2,
                                fontSize: 14,
                                fontWeight: 600,
                                borderRadius: 2,
                                border: '1px solid transparent',
                                color: '#ddd',

                                // transition bundle
                                transition: 'all .25s cubic-bezier(.4,0,.2,1)',

                                // not selected
                                '&:hover': {
                                    color: '#fff',
                                    background: 'rgba(255,255,255,0.08)',
                                    transform: 'translateY(-2px)',
                                },

                                // selected state
                                '&.Mui-selected': {
                                    color: '#fff',
                                    background:
                                        'linear-gradient(135deg, #ff216f 0%, #ff9033 100%)', // sunset gradient
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.45)',
                                    borderColor: 'rgba(255,255,255,0.25)',
                                    '&:hover': {
                                        background:
                                            'linear-gradient(135deg, #ff5185 0%, #ffa463 100%)',
                                        boxShadow: '0 3px 8px rgba(0,0,0,0.55)',
                                    },
                                },

                                // focus (keyboard)
                                '&.Mui-focusVisible': {
                                    outline: '2px solid #ff7a00',
                                    outlineOffset: 2,
                                },
                            }}
                        >
                            {label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>



                {
                    selection == "results" ?
                        (
                            (session == "Race" || session == "Sprint") ? <RaceResultsTable results={results} year={year} round={round} session={session} availableSessions={availableSessions} /> :
                                (session == "Qualifying" || session == "Sprint Qualifying" || session == "Sprint Shootout") ? <QualiResultsTable results={results} year={year} round={round} session={session} availableSessions={availableSessions} /> :
                                    <PracticeResultsTable results={results} year={year} round={round} session={session} availableSessions={availableSessions} />
                        )
                        :
                        selection == "strategy" ?
                            <Box padding={3} width={"1200px"} maxWidth={"100%"} alignItems={"center"}>
                                <Typography fontWeight={"bold"} fontSize={22} sx={{ mb: 2 }}>
                                    {year} {round.slice(3)} {session} Strategy
                                </Typography>
                                {
                                    lapsData.length > 1 ?
                                        <TyreStrategyChart laps={lapsData} drivers={driverData} clickable={false} onClick={(laps, index, add) => { }} />
                                        :
                                        <Typography>Loading...</Typography>
                                }
                            </Box>
                            :
                            selection == "laptimes" ?
                                <Box padding={3} width={"100%"} alignItems={"center"}>
                                    <Typography fontWeight={"bold"} fontSize={22} sx={{ mb: 2 }}>
                                        {year} {round.slice(3)} {session} Lap Times
                                    </Typography>
                                    {
                                        lapsData.length > 1 ?
                                            <LapChart laps={lapsData} drivers={driverData} />
                                            :
                                            <Typography>Loading...</Typography>
                                    }
                                </Box>
                                :
                                selection == "pitperformance" ?
                                    <Box padding={3} width={"1700px"} maxWidth={"100%"} height={"calc(100vh - 200px)"} alignItems={"center"}>
                                        <Typography fontWeight={"bold"} fontSize={22} sx={{ mb: 2 }}>
                                            {year} {round.slice(3)} {session} Pit Performance
                                        </Typography>
                                        {
                                            lapsData.length > 1 ?
                                                <PitPerformanceChart allLapsData={lapsData} driversData={driverData} />
                                                :
                                                <Typography>Loading...</Typography>
                                        }
                                    </Box>
                                    :
                                    selection == "positions" ?
                                        <Box padding={3} width={"1900px"} maxWidth={"100%"} height={"calc(100vh - 160px)"} alignItems={"center"}>
                                            <Typography fontWeight={"bold"} fontSize={22} sx={{ mb: 2 }}>
                                                {year} {round.slice(3)} {session} Position Changes
                                            </Typography>
                                            {
                                                lapsData.length > 1 ?
                                                    <PositionChanges laps={lapsData} drivers={driverData} />
                                                    :
                                                    <Typography>Loading...</Typography>
                                            }
                                        </Box>
                                        :
                                        selection == "maxspeed" ?
                                            <Box padding={3} width={"1900px"} maxWidth={"100%"} height={"calc(100vh - 160px)"} alignItems={"center"}>
                                                <Typography fontWeight={"bold"} fontSize={22} sx={{ mb: 2 }}>
                                                    {year} {round.slice(3)} {session} Min/Max Speeds
                                                </Typography>
                                                {
                                                    lapsData.length > 1 ?
                                                        <SpeedsChart laps={lapsData} drivers={driverData} />
                                                        :
                                                        <Typography>Loading...</Typography>
                                                }
                                            </Box>
                                            :
                                            <Box padding={3} width={"1900px"} maxWidth={"100%"} height={"calc(100vh - 160px)"} alignItems={"center"}>
                                                <Typography fontWeight={"bold"} fontSize={22} sx={{ mb: 2 }}>
                                                    {year} {round.slice(3)} {session} Telemetry Comparison
                                                </Typography>
                                                {
                                                    lapsData.length > 1 ?
                                                        <SpeedDistance laps={lapsData} drivers={driverData} year={year} round={round} session={session} />
                                                        :
                                                        <Typography>Loading...</Typography>
                                                }
                                            </Box>
                }
            </Box>

        </ThemeProvider>
    );
}