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

  useEffect(() => {
    const loadSeasonData = async () => {
      // Gets the current year to load
      const year = (new Date()).getFullYear().toString();

      // Fetching standings and races
      const [fetchedRaces, fetchedStandings] = await Promise.all([
        fetchYearSchedule(year),
        fetchStandings(year),
      ]);
      setRaces(fetchedRaces);
      setStandings(fetchedStandings);
    };

    loadSeasonData();
  }, []);

  // Displays the last 7 races and 1 future race - if not enough past races, will display more future races
  const today = new Date();
  const pastRaces = races.filter(race => new Date(race.date) < today);
  const upcomingRaces = races.filter(race => new Date(race.date) >= today);
  const displayRaces = [...pastRaces.slice(-7), ...upcomingRaces].slice(0, 8);

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