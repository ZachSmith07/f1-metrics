"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
//import styles from "./Home.module.css";
import darkTheme from "../theme";
import { EmptyEvent, ResultsEvent, fetchYearSchedule } from "../utils/fetchYearData";
import { DisplayEvents } from "../components/DisplayEvents";
import { DisplayConstructorStandings, DisplayDriverStandings } from "../components/DisplayStandings";
import { CssBaseline, ThemeProvider, Stack, Typography, Box, ToggleButtonGroup, ToggleButton } from "@mui/material";
import EmojiFlagsIcon from "@mui/icons-material/EmojiFlags";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useSearchParams } from 'next/navigation';
import EngineeringIcon from "@mui/icons-material/Engineering";

import Navbar from "../components/Navbar";
import { Standings, fetchStandings } from "../utils/fetchStandings";

export default function Dash() {
    const [events, setEvents] = useState<(ResultsEvent | EmptyEvent)[]>([]);
    const [standings, setStandings] = useState<Standings>({ drivers: [], teams: [] });

    const [selection, setSelection] = useState("events");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const sectionParam = params.get("section");
            if (sectionParam === "drivers" || sectionParam === "constructors") {
                setSelection(sectionParam);
            }
        }
    }, []);



    const handleChange = (_: React.MouseEvent<HTMLElement>, newSelection: string | null) => {
        if (newSelection !== null) {
            setSelection(newSelection);
        }
    };

    const loadEvents = async (year: string) => {
        let newEvents: (EmptyEvent | ResultsEvent)[] = await fetchYearSchedule(year);

        console.log(newEvents);

        setEvents(newEvents)
    }

    const loadStandings = async (year: string) => {
        let standings: Standings = await fetchStandings(year);

        console.log(standings);

        setStandings(standings);
    }

    useEffect(() => {
        loadEvents("2025");
        loadStandings("2025");
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
                        p: 0.5,
                        gap: 0.5,
                        borderRadius: 3,
                        background: 'rgba(40,40,40,0.6)',
                        backdropFilter: 'blur(6px)',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                        flexWrap: 'wrap',
                    }}
                >
                    {[
                        {
                            label: 'Events',
                            value: 'events',
                            icon: <EmojiFlagsIcon sx={{ fontSize: 18, mr: 1 }} />,
                        },
                        {
                            label: 'Drivers',
                            value: 'drivers',
                            icon: <EmojiEventsIcon sx={{ fontSize: 18, mr: 1 }} />,
                        },
                        {
                            label: 'Constructors',
                            value: 'constructors',
                            icon: <EngineeringIcon sx={{ fontSize: 18, mr: 1 }} />,
                        },
                    ].map(({ label, value, icon }) => (
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
                                display: 'flex',
                                alignItems: 'center',

                                transition: 'all .25s cubic-bezier(.4,0,.2,1)',

                                '&:hover': {
                                    color: '#fff',
                                    background: 'rgba(255,255,255,0.08)',
                                    transform: 'translateY(-2px)',
                                },

                                '&.Mui-selected': {
                                    color: '#fff',
                                    background:
                                        'linear-gradient(135deg, #ff216f 0%, #ff9033 100%)',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.45)',
                                    borderColor: 'rgba(255,255,255,0.25)',
                                    '&:hover': {
                                        background:
                                            'linear-gradient(135deg, #ff5185 0%, #ffa463 100%)',
                                        boxShadow: '0 3px 8px rgba(0,0,0,0.55)',
                                    },
                                },

                                '&.Mui-focusVisible': {
                                    outline: '2px solid #ff7a00',
                                    outlineOffset: 2,
                                },
                            }}
                        >
                            {icon}
                            {label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>




                {/* <Box display="flex" justifyContent="center">
                    <DisplayEvents events={events} />
                </Box> */}
                {
                    selection == "events" ?
                        <Box display="flex" justifyContent="center">
                            <DisplayEvents events={events} />
                        </Box>
                        :
                        (
                            selection == "drivers" ?
                                <Box display="flex" justifyContent="center">
                                    <DisplayDriverStandings standings={standings.drivers} />
                                </Box>
                                :
                                <Box display="flex" justifyContent="center">
                                    <DisplayConstructorStandings standings={standings.teams} />
                                </Box>
                        )
                }
            </Box>

        </ThemeProvider>
    );
}