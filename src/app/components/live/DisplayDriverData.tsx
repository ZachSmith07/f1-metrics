import React, { useEffect, useMemo, useState } from "react";
import { LiveDriverData } from "../../liveDash/[year]/[round]/[session]/page";
import { Box, Button } from "@mui/material";
import { LiveDriverPosition, LiveDriverSector, LiveDriverTyre } from "@/app/utils/fetchLiveData";
import { motion, Reorder } from "framer-motion";
import { formatLapTime } from "@/app/utils/formatting";

// defines inputs to DisplayDriverData
interface DisplayDriverDataProps {
  positions: LiveDriverPosition[];
  drivers: { [key: string]: LiveDriverData };
  showTelem: boolean;
  onClick: Function;
  driversActive: number;
}

// displays the leaderboard
export const DisplayDriverData: React.FC<DisplayDriverDataProps> = ({
  positions,
  drivers,
  showTelem,
  onClick,
  driversActive
}) => {
  const [currentPositions, setCurrentPositions] = useState<number[]>([]);

  // calls when positions are changed (order of rows in leaderboard changed)
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const updatePositions = () => {
      // sets the new positions to re-order the leaderboard
      let currentPos: number[] = [];
      let timeUntil: number = -1;
      for (let i = 0; i < positions.length; i++) {
        if (positions[i].time <= new Date()) {
          currentPos = positions[i].driverNums;
        } else {
          timeUntil = (positions[i].time.getTime() - (new Date()).getTime());
          break;
        }
      }
      setCurrentPositions(currentPos);
      if (timeUntil != -1) {
        // waits until next position update
        timeout = setTimeout(updatePositions, timeUntil);
      }
    };
    updatePositions();
  }, [positions]);

  return (
    <Box padding={2}>
      {/* smoothly re-orders changing positions */}
      <Reorder.Group axis="y" values={currentPositions} onReorder={setCurrentPositions}>

        {/* renders each row */}
        {currentPositions.map((number, index) => {
          // driver of position: index + 1
          const driver = drivers[`${number}`];
          if (!driver) return null; // if driver doesn't exist, return null

          return (
            // Setting the re-ordering transition animation
            <Reorder.Item key={number} value={number} style={{ listStyle: "none" }} dragListener={false} drag={false}>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                {/* sets background colour of the row */}
                <Box
                  bgcolor={index % 2 == 0 ? "#0005" : "#0009"}
                  padding={"4px 16px 4px 10px"}
                  borderRadius={index == 0 ? "10px 10px 0px 0px" : index == currentPositions.length - 1 ? "0px 0px 10px 10px" : "0px"}
                  position="relative"
                >

                  {/* if driver no longer in the session puts over a darker overlay */}
                  {index >= driversActive && (
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      bgcolor="#0004"
                      borderRadius={index == 0 ? "10px 10px 0px 0px" : index == currentPositions.length - 1 ? "0px 0px 10px 10px" : "0px"}
                      zIndex={2}
                    />
                  )}

                  {/* Box containing the actual items */}
                  <Box flexDirection={"row"} display={"flex"} alignItems={"center"}>
                    {/* live-timing button */}
                    <motion.div
                      whileHover={{ scale: 1.05 }} // expands on hover
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      style={{ display: "inline-block" }}
                    >

                      <Button
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "start",
                          border: "none",
                          borderRadius: "10px",
                          color: "white",
                          fontSize: "18px",
                          width: "108px",
                          height: "50px",
                          cursor: "pointer",
                          textTransform: "none",
                          backgroundColor: "transparent",
                          transition: "background-color 0.2s ease-in-out",
                          "&:hover": {
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                          },
                        }}
                        onClick={() => {
                          console.log(driver);
                          onClick(number);
                        }}
                      >
                        {/* position text */}
                        <div
                          style={{
                            fontSize: "22px",
                            width: "24px",
                            marginRight: "10px",
                            fontWeight: "bold",
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          {index + 1}
                        </div>
                        {/* team colour stripe */}
                        <div
                          style={{
                            backgroundColor: driver.driver.teamColour,
                            width: "6px",
                            height: "30px",
                            marginRight: "8px",
                          }}
                        />
                        {/* 3 letter driver abbreviation */}
                        <div style={{ display: "flex", alignItems: "baseline", fontWeight: "bold" }}>
                          <span style={{ fontWeight: "bold" }}>{driver.driver.driver.split(" ")[0]}</span>
                        </div>
                      </Button>
                    </motion.div>

                    {/* displays interval, lap/sector times and tyres */}
                    <DisplayInterval telemetry={driver} position={index + 1} />
                    <DisplayLaptimes telemetry={driver} />
                    <DisplayTyres telemetry={driver} />
                  </Box>
                </Box>
              </motion.div>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </Box>
  );
};

const DisplayInterval = ({
  telemetry,
  position
}: {
  telemetry: LiveDriverData,
  position: number
}) => {
  // initialises displayed values
  const [interval, setIntervalValue] = useState<string>("0");
  const [gapToLeader, setGapToLeader] = useState<string>("0");

  useEffect(() => {
    if (telemetry.intervals.length === 0) return;

    let timeout2: ReturnType<typeof setTimeout> | null = null;

    const updateInterval = () => {
      const now = new Date();
      const intervals = telemetry.intervals;

      let timeUntil = -1;
      let currentInterval;

      for (let i = 0; i < intervals.length; i++) {
        if (intervals[i].time.getTime() <= now.getTime()) {
          currentInterval = intervals[i];
        } else {
          // finds time until next update
          timeUntil = intervals[i].time.getTime() - now.getTime();
          break;
        }
      }

      if (currentInterval) {
        // sets new intervals
        setIntervalValue(currentInterval.interval);
        setGapToLeader(currentInterval.gapToLeader);

        // waits for next interval frame
        timeout2 = setTimeout(updateInterval, timeUntil);
      } else if (timeUntil !== -1) {
        timeout2 = setTimeout(updateInterval, timeUntil);
      }
    };

    updateInterval();

    return () => {
      if (timeout2) clearTimeout(timeout2);
    };
  }, [telemetry.intervals]);


  const displayInterval = position === 1 ? '-.---' : interval == "0" ? "-.---" : interval;
  const displayGap = position === 1 ? '-.---' : gapToLeader == "0" ? "-.---" : gapToLeader;

  // displays interval/gap to leader
  return (
    <div style={{ textAlign: 'end', width: 100 }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 600 }}>
        {displayInterval}
      </div>
      <div style={{ fontSize: '0.85rem', color: '#AAA' }}>
        {displayGap}
      </div>
    </div>
  );
};

const DisplayLaptimes = ({
  telemetry
}: {
  telemetry: LiveDriverData
}) => {
  // initialises display values
  const [lap, setLap] = useState<LiveDriverSector>({ driverNum: 0, duration: 0, pbDuration: 0, sectorNum: 0, time: new Date(), currentLap: true });
  const [s1, setS1] = useState<LiveDriverSector>({ driverNum: 0, duration: 0, pbDuration: 0, sectorNum: 0, time: new Date(), currentLap: true });
  const [s2, setS2] = useState<LiveDriverSector>({ driverNum: 0, duration: 0, pbDuration: 0, sectorNum: 0, time: new Date(), currentLap: true });
  const [s3, setS3] = useState<LiveDriverSector>({ driverNum: 0, duration: 0, pbDuration: 0, sectorNum: 0, time: new Date(), currentLap: true });

  useEffect(() => {
    if (telemetry.sectors.length === 0) return;

    let timeout2: ReturnType<typeof setTimeout> | null = null;

    const updateSectors = () => {
      const now = new Date();
      const sectors = telemetry.sectors;

      let timeUntil = -1;
      let currentLap;
      let currentS1;
      let currentS2;
      let currentS3;

      for (let i = 0; i < sectors.length; i++) {
        if (sectors[i].time.getTime() <= now.getTime()) {
          // checks which sector/lap it is and sets it
          if (sectors[i].sectorNum == 0) {
            currentLap = sectors[i];
          }
          if (sectors[i].sectorNum == 1) {
            currentS1 = sectors[i];
          }
          if (sectors[i].sectorNum == 2) {
            currentS2 = sectors[i];
          }
          if (sectors[i].sectorNum == 3) {
            currentS3 = sectors[i];
          }
        } else {
          // time until next update
          timeUntil = sectors[i].time.getTime() - now.getTime();
          break;
        }
      }

      // sets displayed values
      if (currentLap) {
        setLap(currentLap);
      }
      if (currentS1) {
        setS1(currentS1);
      }
      if (currentS2) {
        setS2(currentS2);
      }
      if (currentS3) {
        setS3(currentS3);
      }

      if (timeUntil !== -1) {
        // waits until next sector frame
        timeout2 = setTimeout(updateSectors, timeUntil);
      }
    };

    updateSectors();

    return () => {
      if (timeout2) clearTimeout(timeout2);
    };
  }, [telemetry.sectors]);

  // displays each sector/lap time
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* maps through each lap and sector */}
      {[
        { key: "lap", width: 115, value: lap.duration, pb: lap.pbDuration, formatter: formatLapTime, fallback: "-:--.---" },
        { key: "s1", width: 70, value: s1.duration, pb: s1.pbDuration, formatter: (v: number) => v.toFixed(3), fallback: "--.---" },
        { key: "s2", width: 70, value: s2.duration, pb: s2.pbDuration, formatter: (v: number) => v.toFixed(3), fallback: "--.---" },
        { key: "s3", width: 70, value: s3.duration, pb: s3.pbDuration, formatter: (v: number) => v.toFixed(3), fallback: "--.---" },
      ].map(({ key, width, value, pb, formatter, fallback }) => (
        <div key={key} style={{ textAlign: 'end', width }}>
          {/* top value - larger text */}
          <div style={{ fontSize: '1.2rem', fontWeight: 550 }}>
            {value === 0 ? fallback : formatter(value)}
          </div>
          {/* smaller greyer text */}
          <div style={{ fontSize: '0.85rem', color: '#AAA' }}>
            {pb === 0 ? fallback : formatter(pb)}
          </div>
        </div>
      ))}
    </div>
  );
};

// displays tyre data
const DisplayTyres = ({
  telemetry
}: {
  telemetry: LiveDriverData
}) => {
  // initialises current tyre data
  const [tyre, setTyre] = useState<LiveDriverTyre>({ driverNum: 0, compound: "UNKNOWN", tyreAge: 0, time: new Date() });


  useEffect(() => {
    if (telemetry.tyres.length === 0) return;

    let timeout2: ReturnType<typeof setTimeout> | null = null;

    const updateTyres = () => {
      const now = new Date();
      const tyres = telemetry.tyres;

      let timeUntil = -1;
      let tyre: LiveDriverTyre = { driverNum: 0, compound: "UNKNOWN", tyreAge: 0, time: new Date() };

      for (let i = 0; i < tyres.length; i++) {
        if (tyres[i].time.getTime() <= now.getTime()) {
          tyre = tyres[i];
        } else {
          timeUntil = tyres[i].time.getTime() - now.getTime();
          break;
        }
      }

      // updates the tyre if a valid tyre
      if (tyre.compound != "UNKNOWN") {
        setTyre(tyre);
      }

      if (timeUntil !== -1) {
        // waits until next update
        timeout2 = setTimeout(updateTyres, timeUntil);
      }
    };

    updateTyres();

    return () => {
      if (timeout2) clearTimeout(timeout2);
    };
  }, [telemetry.tyres]);

  try {
    return (
      <div style={{ marginLeft: 20, display: 'flex', gap: 10, alignItems: "center", fontWeight: "bold" }}>
        {/* displays tyre image */}
        <img
          src={`/tyres/${tyre.compound.toLowerCase()}.svg`}
          alt={tyre.compound}
          width={40}
          height={40}
        />
        {/* displays tyre age */}
        {tyre.tyreAge}L
      </div>
    );
  }
  catch (e) {
    // if image doesn't exist return nothing
    return null;
  }
};