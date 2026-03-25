"use client";

import React, { useEffect, useRef, useState } from "react";
import darkTheme from "../../../../theme";
import { CssBaseline, ThemeProvider, Stack, Typography, Box, AppBar, Toolbar, IconButton, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from "@mui/material";
import { FastestSectors, getLiveData, getLiveDrivers, getLiveSession, getTrackMap, LiveData, LiveDriver, LiveDriverInterval, LiveDriverFastestLap, LiveDriverPosition, LiveDriverSector, LiveDriverSectorTiming, LiveDriverTyre, LiveLocation, LiveSession, LiveTelemetry, Pos } from "../../../../utils/fetchLiveData";
import { TrackMapDisplay } from "../../../../components/live/TrackMapDisplay";
import { DisplayDriverData } from "../../../../components/live/DisplayDriverData";
import HomeIcon from '@mui/icons-material/Home';
import { useParams } from "next/navigation";
import { DriverPopupBar } from "@/app/components/live/LiveTiming";

export interface LiveDriverData {
  driver: LiveDriver;
  telemetry: LiveTelemetry[];
  position: LiveLocation[];
  intervals: LiveDriverInterval[];
  sectors: LiveDriverSector[];
  tyres: LiveDriverTyre[];
  liveTiming: LiveDriverSectorTiming | undefined;
}

export default function LiveDash() {

  let delayToRealTime = 0;
  let date: Date = new Date();
  const delayRef = useRef(0); // delay text
  const timeBefore = 1.25; // time before start to start download

  // finds basic session data
  const params = useParams();
  const year = params.year as string;
  const eventName = decodeURIComponent(params.round as string);
  const sessionName = decodeURIComponent(params.session as string);

  const [mapPoints, setMapPoints] = useState<Pos[]>([]); // track map points
  const [sessionData, setSession] = useState<LiveSession>(new LiveSession("", "", 0, "", 0, [], new Date())); // session name and other data
  const [telemetryData, setTelemetryData] = useState<{ [key: string]: LiveDriverData }>({}); // driver telemetry data
  const [fastestLaps, setFastestLaps] = useState<{ [key: string]: LiveDriverFastestLap }>({}); // driver's laps data
  const [fastestSectors, setFastestSectors] = useState<FastestSectors>({ s1: -1, s2: -1, s3: -1 }); // fastest sectors
  const [lapNumber, setLapNumber] = useState<number>(0); // current lap number

  const [driversSelected, setDriversSelected] = useState<number[]>([]); // current selected drivers (bottom row)

  const [trackState, setTrackState] = useState<number>(0); // current track state (e.g. yellow flags)

  const [driversActive, setDriversActive] = useState<number>(20); // sets number of drivers remaining in the session

  // sets delay variables
  const [isEditing, setIsEditing] = useState(false); // (if editing the text field)
  const [inputValue, setInputValue] = useState(
    delayRef.current.toFixed(1)
  );

  const hasRun = useRef(false); // if startup has happened
  let driverData: LiveDriver[] = [];
  let driverPositions: LiveDriverPosition[] = [];
  const [driverPositionsConst, setDriverPositions] = useState<LiveDriverPosition[]>([]);
  const [currentDriverPositions, setCurrentPosition] = useState<LiveDriverPosition | undefined>();

  function getCurrentTime(date: Date): Date {
    let dateTime = date.getTime() - 8000 - delayToRealTime * 1000;
    const next = dateTime - dateTime % 2500;

    return new Date(next);
  }

  // starts session
  const startSession = async () => {
    // gets live session data
    let liveSession: LiveSession = await getLiveSession(year, eventName, sessionName);
    // sets session offset
    const sessionEndDate = new Date(new Date(liveSession.startDate).getTime());
    const offsetInMinutes = new Date(date.toISOString()).getTimezoneOffset() - 60;
    let offset = 0;
    if (eventName == "Monaco Grand Prix")
    {
      offset = -7200;
    }
    const offsetInSeconds = -offsetInMinutes * 60 + offset;
    let currentDateOff = new Date((new Date()).getTime());
    
    if (currentDateOff < sessionEndDate) {
      date = getCurrentTime(currentDateOff);
    }
    else {
      date = new Date(liveSession.startDate);
      console.log(date);
      console.log(offsetInSeconds);
      date = new Date(date.getTime() + offsetInSeconds * 1000);
      console.log(date);
    }
    setSession(liveSession);

    // loads driver and map
    let drivers: LiveDriver[] = await getLiveDrivers(year, eventName, sessionName);
    driverData = drivers;
    let trackMap: Pos[] = await getTrackMap(year, eventName, sessionName);
    setMapPoints(trackMap);
    delayRef.current = ((new Date()).getTime() - date.getTime()) / 1000 + timeBefore;

    // loads current telemetry
    loadData();
  };


  const loadData = async (original = false, delay = delayRef.current) => {
    // fetches live data
    let liveData: LiveData = await getLiveData(date, 20, year, eventName, sessionName, driverData);
    let telem = liveData.telemetry;
    let newTelemetryData = { ...telemetryData }; // Create a copy to update

    telemetryData;

    for (let i = 0; i < telem.length; i++) {
      telem[i].time = new Date(telem[i].time.getTime() + delay * 1000 - timeBefore * 1000 + 350);
    }

    // Update telemetry data to each driver
    for (let i = 0; i < telem.length; i++) {
      if (telem[i].driverNum in newTelemetryData) {
        newTelemetryData[telem[i].driverNum].telemetry.push(telem[i]);
      } else {
        let driver: LiveDriver = driverData[driverData.map((x) => x.driverNumber).indexOf(telem[i].driverNum)];
        newTelemetryData[telem[i].driverNum] = { driver: driver, telemetry: [telem[i]], position: [], intervals: [], sectors: [], tyres: [], liveTiming: undefined };
      }
    }

    // Update positions data to each driver
    let positions = liveData.positions;
    for (let i = 0; i < positions.length; i++) {
      positions[i].time = new Date(positions[i].time.getTime() + delay * 1000 - timeBefore * 1000 + 350);
    }
    for (let i = 0; i < positions.length; i++) {
      if (positions[i].driverNum in newTelemetryData) {
        if (driverData.map((x) => x.driverNumber).includes(positions[i].driverNum)) {
          newTelemetryData[positions[i].driverNum].position.push(positions[i]);
        }
      } else {
        if (driverData[driverData.map((x) => x.driverNumber).indexOf(positions[i].driverNum)] == undefined) {
          console.log(`safety CAR: ${positions[i].driverNum}`)
        }
        let driver: LiveDriver = driverData[driverData.map((x) => x.driverNumber).indexOf(positions[i].driverNum)];
        newTelemetryData[positions[i].driverNum] = { driver: driver, telemetry: [], position: [positions[i]], intervals: [], sectors: [], tyres: [], liveTiming: undefined };
      }
    }

    // upadtes intervals to each driver
    let intervals = liveData.driverIntervals;
    for (let i = 0; i < intervals.length; i++) {
      intervals[i].time = new Date(intervals[i].time.getTime() + delay * 1000 - timeBefore * 1000 + 350);
    }
    for (let i = 0; i < intervals.length; i++) {
      if (intervals[i].driverNum in newTelemetryData) {
        newTelemetryData[intervals[i].driverNum].intervals.push(intervals[i]);
      } else {
        let driver: LiveDriver = driverData[driverData.map((x) => x.driverNumber).indexOf(intervals[i].driverNum)];
        newTelemetryData[intervals[i].driverNum] = { driver: driver, telemetry: [], position: [], intervals: [intervals[i]], sectors: [], tyres: [], liveTiming: undefined };
      }
    }

    // updates sectors
    let sectors = liveData.driverSectors;
    for (let i = 0; i < sectors.length; i++) {
      sectors[i].time = new Date(sectors[i].time.getTime() + delay * 1000 - timeBefore * 1000 + 350);
    }
    for (let i = 0; i < sectors.length; i++) {
      if (sectors[i].driverNum in newTelemetryData) {
        newTelemetryData[sectors[i].driverNum].sectors.push(sectors[i]);
      } else {
        let driver: LiveDriver = driverData[driverData.map((x) => x.driverNumber).indexOf(sectors[i].driverNum)];
        newTelemetryData[sectors[i].driverNum] = { driver: driver, telemetry: [], position: [], sectors: [sectors[i]], intervals: [], tyres: [], liveTiming: undefined };
      }
    }

    // updates tyres
    let tyres = liveData.driverTyres;
    for (let i = 0; i < tyres.length; i++) {
      tyres[i].time = new Date(tyres[i].time.getTime() + delay * 1000 - timeBefore * 1000 + 350);
    }
    for (let i = 0; i < tyres.length; i++) {
      if (tyres[i].driverNum in newTelemetryData) {
        newTelemetryData[tyres[i].driverNum].tyres.push(tyres[i]);
      } else {
        let driver: LiveDriver = driverData[driverData.map((x) => x.driverNumber).indexOf(tyres[i].driverNum)];
        newTelemetryData[tyres[i].driverNum] = { driver: driver, telemetry: [], position: [], tyres: [tyres[i]], intervals: [], sectors: [], liveTiming: undefined };
      }
    }

    // updates live sectors
    let liveSectors = liveData.driverLiveTiming;
    for (let i = 0; i < liveSectors.length; i++) {
      let liveSector = liveSectors[i];
      liveSector.time = new Date(liveSector.time.getTime() + delay * 1000 - timeBefore * 1000 + 350);
      if (liveSector.driverNum in newTelemetryData) {
        newTelemetryData[liveSector.driverNum].liveTiming = liveSector;
      } else {
        let driver: LiveDriver = driverData[driverData.map((x) => x.driverNumber).indexOf(liveSector.driverNum)];
        newTelemetryData[liveSector.driverNum] = { driver: driver, telemetry: [], position: [], tyres: [], intervals: [], sectors: [], liveTiming: liveSector };
      }
    }

    // updates positions
    let driverPos = liveData.driverPositions;
    for (let i = 0; i < driverPos.length; i++) {
      let driverPosition = driverPos[i];
      driverPosition.time = new Date(driverPosition.time.getTime() + delay * 1000 - timeBefore * 1000 + 350);
      driverPositions.push(driverPosition);
    }
    let currentPos: undefined | LiveDriverPosition;
    for (let i = 0; i < driverPositions.length; i++) {
      if (driverPositions[i].time <= new Date()) {
        currentPos = driverPositions[i];
      }
      else {
        break;
      }
    }

    // sets the current positions for order of track map
    if (currentPos != undefined) {
      setCurrentPosition(currentPos);
    }
    else if (driverPositions.length > 0) {
      setCurrentPosition(driverPositions[driverPositions.length - 1]);
    }

    // sets the fastest laps and sectors
    setFastestLaps(liveData.fastestLaps);
    setFastestSectors(liveData.fastestSectors);

    // sets current number of driver's still participating
    setDriversActive(liveData.driversActive);

    // sets driver position updates
    setDriverPositions([...driverPositions]);

    // sets telemetry updates
    setTelemetryData(newTelemetryData);

    // sets current lap number
    setLapNumber(liveData.lapNumber);

    // sets the track status
    setTrackState(liveData.trackState);

    // finds delay to next time to fetch update - in milloseconds
    date = new Date(date.getTime() + 2500);
    let loadDate = new Date(date.getTime() - timeBefore * 1000 + delay * 1000);
    let msDelay = (loadDate.getTime() - (new Date().getTime()));
    while (msDelay <= -2500) {
      date = new Date(date.getTime() + 2500);
      loadDate = new Date(date.getTime() - timeBefore * 1000 + delay * 1000);
      msDelay = (loadDate.getTime() - (new Date().getTime()));
    }
    if (msDelay > 2500) {
      let nDate = new Date((new Date()).getTime() - delay * 1000);
      date = new Date(nDate.getTime() - (nDate.getTime() % 2500));
      loadDate = new Date(date.getTime() - timeBefore * 1000 + delay * 1000);
      msDelay = (loadDate.getTime() - (new Date().getTime()));
    }
    const timeout = setTimeout(() => {
      loadData();
    }, msDelay);
  };

  // starts up the session
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true; // ensures startup only occurs once

    startSession();
  }, []);

  // sets up page layout (track map with leaderboard positioning - whether they are all in one row)
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(3200);
  const [containerHeight, setContainerHeight] = useState(1400);
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const updateSizes = () => {
      setWindowWidth(window.innerWidth);
      if (containerRef.current) {
        const fullWidth = containerRef.current.offsetWidth;
        setContainerWidth(fullWidth);
        setContainerHeight(window.innerHeight * 0.9);
      }
    };

    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, []);
  const mapHeight = (2 * containerWidth) / 3;
  const isWide = windowWidth > 1650;

  return (
    <>
      {/* top app bar */}
      <AppBar position="static" color="default" elevation={2} sx={{ backgroundColor: '#121212' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}>
            {/* home button */}
            <IconButton
              size="small"
              edge="start"
              color="inherit"
              aria-label="home"
              sx={{ p: 0.5 }}
              onClick={() => {
                window.location.href = '/';
              }}
            >
              <HomeIcon fontSize="small" />
            </IconButton>

            {/* flag image */}
            {sessionData.country && (
              <img
                src={`/flags/${sessionData.country}.svg`}
                alt={`${sessionData.country} flag`}
                style={{ width: 30, height: 23, marginLeft: 4 }}
              />
            )}

            {/* session name */}
            <Typography variant="h6" color="inherit" noWrap fontWeight="bold">
              {sessionData.name} — {sessionData.session}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={3}>
            {
              <Box
                component="div"
                flexDirection="row"
                display="flex"
                alignItems="center"
                gap={0.6}
                ml="auto"
              >
                <Typography variant="h6" color="inherit" noWrap>
                  Delay:
                </Typography>

                {/* delay number input */}
                <TextField
                  size="small"
                  variant="standard"
                  type="number"
                  value={isEditing ? inputValue : delayRef.current.toFixed(1)}
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      borderRadius: 1,
                      px: 1,
                      py: '4px',
                      width: delayRef.current.toFixed(1).length * 13 + 14,

                      '& input': {
                        color: 'inherit',
                        textAlign: 'center',
                        MozAppearance: 'textfield',
                      },

                      '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                        WebkitAppearance: 'inner-spin-button',
                        color: 'white',             // the arrow color
                        backgroundColor: 'transparent', // transparent bg
                        width: 'auto',
                        margin: 0,
                      },

                      '& input[type=number]': {
                        MozAppearance: 'textfield',
                      },
                      '& input[type=number]::-moz-inner-spin-button, & input[type=number]::-moz-outer-spin-button': {
                        MozAppearance: 'inner-spin-button',
                        color: 'white',             // Firefox arrows
                        backgroundColor: 'transparent',
                      },
                    },
                  }}

                  inputProps={{
                    onKeyDown: (e) => {
                      if (e.key === 'Enter') (e.currentTarget.blur());
                    },
                  }}
                  onFocus={() => {
                    setInputValue(delayRef.current.toFixed(1));
                    setIsEditing(true);
                  }}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={() => {
                    const parsed = parseFloat(inputValue);
                    if (!isNaN(parsed)) delayRef.current = parsed;
                    setIsEditing(false);
                  }}
                />
              </Box>
            }
            {
              // displays lap number
              sessionData.session == "Race" &&
              <Typography variant="h6" color="inherit" noWrap>
                Lap {lapNumber}/{sessionData.laps}
              </Typography>
            }

            {
              trackState === 7 ? (
                // shows chequered flag
                <Box
                  sx={{
                    backgroundColor: "black",
                    color: "white",
                    fontWeight: "bold",
                    width: "140px",
                    borderRadius: 2,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                    py: 0.5,
                    border: "2px solid white",
                  }}
                >
                  Chequered Flag
                </Box>
              ) : (
                // shows other track states
                <Box
                  sx={{
                    backgroundColor: ["#00ad62", "#c40000", "#c8d422", "#c8d422", "#c8d422", "#c8d422", "#c8d422"][trackState],
                    fontWeight: "bold",
                    width: "115px",
                    borderRadius: 2,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                    py: 0.5,

                    outline:
                      trackState === 2 ? "3px solid #FF2222" :
                        trackState === 4 ? "3px dashed #FF2222" :
                          trackState === 3 ? "3px solid #FF2222" :
                            trackState === 5 ? "3px dashed #FF2222" :
                              "none",

                    animation:
                      trackState === 3 ? "flash-outline 2s infinite" :
                        trackState === 5 ? "flash-outline 2s infinite" :
                          "none",
                  }}
                >
                  <Typography fontWeight={"bold"}>
                    {["Track Clear", "Red Flag", "SC", "SC Ending", "VSC", "VSC Ending", "Yellow Flag"][trackState]}
                  </Typography>
                </Box>
              )
            }
          </Box>

        </Toolbar>
      </AppBar>

      {/* container ref to help with checking width */}
      <Box ref={containerRef} width="100%" px={1}>
        {/* if wide enough displays as row, otherwise displays as a column */}
        <Box
          display="flex"
          flexDirection={isWide ? 'row' : 'column'}
          gap={2}
          alignItems={isWide ? 'flex-start' : 'center'}
          justifyContent="center"
          width="100%"
        >
          <Box
            flexGrow={isWide ? 1 : 0}
            minWidth={isWide ? 600 : containerWidth}
            maxWidth={isWide ? 1400 : containerWidth}
            height={isWide ? containerHeight : mapHeight}
          >
            {/* displays whole track map */}
            <TrackMapDisplay
              points={mapPoints}
              width={isWide ? containerWidth - 750 : containerWidth}
              height={isWide ? containerHeight : mapHeight}
              rotationDeg={sessionData.rotation - 4}
              driversData={telemetryData}
              positions={currentDriverPositions?.driverNums ?? []}
            />
          </Box>

          <Box flexShrink={0}>
            {/* displays driver leaderboard */}
            <DisplayDriverData
              positions={driverPositionsConst}
              drivers={telemetryData}
              showTelem={false}
              onClick={(driverNum: number) => {
                console.log(driverNum);
                let driversSelectedCopy = [...driversSelected];
                if (driversSelectedCopy.includes(driverNum)) {
                  driversSelectedCopy.splice(driversSelectedCopy.indexOf(driverNum), 1);
                }
                else {
                  driversSelectedCopy.push(driverNum);
                }
                setDriversSelected(driversSelectedCopy);
              }}
              driversActive={driversActive}
            />
          </Box>
        </Box>
      </Box>

      {/* displays driver live timing at the bottom of the page */}
      <DriverPopupBar driversSelected={driversSelected} telemetry={telemetryData} positions={driverPositionsConst} fastestLaps={fastestLaps} fastestSectors={fastestSectors} />
    </>
  );
}