// HOME PAGE

"use client";

import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import Navbar from "./components/Navbar";
import { DisplayEventsBasic } from "./components/DisplayEvents";
import { DisplayConstructorStandings, DisplayDriverStandings } from "./components/DisplayStandings";

// IMPORTING DATA FETCHERS
import { ResultsEvent, EmptyEvent, fetchYearSchedule } from "./utils/fetchYearData";
import { Standings, fetchStandings } from "./utils/fetchStandings";

export default function Home() {
  const [races, setRaces] = useState<(ResultsEvent | EmptyEvent)[]>([]);
  const [standings, setStandings] = useState<Standings>({ drivers: [], teams: [] });

  function isResultEvent(race: ResultsEvent | EmptyEvent): race is ResultsEvent {
    return "top3" in race;   // Replace with whichever field only ResultsEvent has
  }

  function isEmptyEvent(race: ResultsEvent | EmptyEvent): race is EmptyEvent {
    return !isResultEvent(race);
  }

  useEffect(() => {
    const loadSeasonData = async () => {
      // Gets the current year to load
      const year = "2025";

      // Fetching standings and races
      const [fetchedRaces, fetchedStandings] = await Promise.all([
        fetchYearSchedule(year),
        fetchStandings(year),
      ]);
      setRaces(fetchedRaces);
      setStandings(fetchedStandings);
      console.log(fetchedRaces);
    };

    loadSeasonData();
  }, []);

  const today = new Date();

  const pastResults = races
    .filter(r => isResultEvent(r))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcoming = races
    .filter(r => isEmptyEvent(r))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log(pastResults);
    console.log(upcoming);

  // --- main logic ---
  let displayRaces: (ResultsEvent | EmptyEvent)[] = [];

  if (pastResults.length >= 7 && upcoming.length > 0) {
    const nextRace = upcoming[0];
    const last7 = pastResults.slice(-7);
    displayRaces = [...last7, nextRace];
  } else {
    displayRaces = [...pastResults.slice(-7), ...upcoming].slice(0, 8);
  }


  return (
    <>
      <Navbar />

      {/* Displays everything. Box is a row, but if not enough space will wrap and allow as a column. */}
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
          <DisplayEventsBasic events={displayRaces.reverse()} />
        </Box>
      </Box>
    </>
  );
}