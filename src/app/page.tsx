"use client";

import { useEffect, useState } from "react";
import {
    CssBaseline,
    ThemeProvider,
    Box,
    Stack,
    Typography,
    Divider,
} from "@mui/material";
import darkTheme from "./theme";
import Navbar from "./components/Navbar";
import { ResultsEvent, EmptyEvent, fetchYearSchedule } from "./utils/fetchYearData";
import { Standings, fetchStandings } from "./utils/fetchStandings";
import { DisplayEvents, DisplayEventsBasic } from "./components/DisplayEvents";
import {
    DisplayConstructorStandings,
    DisplayDriverStandings,
} from "./components/DisplayStandings";
import Footer from "./components/Footer";

export default function Home() {
    const [events, setEvents] = useState<(ResultsEvent | EmptyEvent)[]>([]);
    const [standings, setStandings] = useState<Standings>({ drivers: [], teams: [] });

    useEffect(() => {
        const loadData = async () => {
            const year = "2025";
            const [fetchedEvents, fetchedStandings] = await Promise.all([
                fetchYearSchedule(year),
                fetchStandings(year),
            ]);

            setEvents(fetchedEvents);
            setStandings(fetchedStandings);
        };

        loadData();
    }, []);

    const today = new Date();

    const pastEvents = events.filter(event => new Date(event.date) < today);
    const upcomingEvents = events.filter(event => new Date(event.date) >= today);

    const displayEvents = [...pastEvents.slice(-7), ...upcomingEvents].slice(0, 8);

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Navbar />
            <Box
                display="flex"
                flexDirection="row"
                flexWrap="wrap"
                justifyContent="center"
                gap={4}
            >
                <Box width="500px">
                    <DisplayDriverStandings standings={standings.drivers.slice(0, 8)} width="500px" />
                </Box>

                <Box width="550px">
                    <DisplayConstructorStandings standings={standings.teams.slice(0, 10)} width="550px" />
                </Box>

                <Box width="500px">
                    <DisplayEventsBasic events={displayEvents.reverse()} />
                </Box>
            </Box>
            <Footer />
        </ThemeProvider>
    );
}
