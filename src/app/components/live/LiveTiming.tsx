import { LiveDriverData } from "@/app/liveDash/[year]/[round]/[session]/page";
import { FastestSectors, LiveDriverFastestLap, LiveDriverPosition, LiveDriverSector } from "@/app/utils/fetchLiveData";
import { formatLapTime } from "@/app/utils/formatting";
import { Box, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

// displays sector split
interface SplitProps {
  sectorSplit: number;
  bestSectorSplit: number;
  chasing: string;
}
const SplitDisplay: React.FC<SplitProps> = ({ sectorSplit, bestSectorSplit, chasing }) => {
  // formats seconds
  const seconds = formatLapTime(sectorSplit, true);

  // displays gap to fastest
  return (
    <Box
      display="flex"
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      width="100%"
    >
      <Box
        sx={{
          bgcolor: '#333',
          color: '#fff',
          borderRadius: 1,
          px: 1.5,
          py: 0.5,
          minWidth: 60,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" component="span" fontFamily="monospace">
          {seconds}
        </Typography>
      </Box>


      {
        bestSectorSplit != 0 &&
        <Box justifyItems={"end"}>
          <Typography variant="body2" fontWeight="bold">
            {chasing}
          </Typography>
          <Typography
            variant="body2"
            component="span"
            fontWeight="bold"
            // if faster shows green, otherwise yellow
            color={sectorSplit - bestSectorSplit < 0 ? '#0C0' : '#EDC001'}
          >
            {sectorSplit - bestSectorSplit >= 0 ? '+' : ''}
            {(sectorSplit - bestSectorSplit).toFixed(3)}
          </Typography>
        </Box>
      }
    </Box>
  );
};

// displays ticking stopwatch
interface StopwatchProps {
  startTime: Date;
}
const Stopwatch: React.FC<StopwatchProps> = ({ startTime }) => {
  const [elapsed, setElapsed] = useState(0);

  // calculates stopwatch timing
  useEffect(() => {
    const startMs = startTime.getTime();
    let rafId: number;

    const tick = () => {
      setElapsed(Date.now() - startMs);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [startTime]);


  // Formats to mins if necessary
  const seconds = formatLapTime(elapsed / 1000, true);

  // shows the stopwatch time
  return (
    <Box
      sx={{
        bgcolor: '#333',
        color: '#fff',
        borderRadius: 1,
        px: 1.5,
        py: 0.5,
        minWidth: 60,
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" component="span" fontFamily="monospace">
        {seconds}
      </Typography>
    </Box>
  );
};

// displays the live timing splits of each driver
interface DriverBadgeProps {
  driver: LiveDriverData;
  position: number;
  fastestLapSectors: LiveDriverFastestLap;
  fastestSectors: FastestSectors;
  fastestLaps: { [key: string]: LiveDriverFastestLap };
  telemetry: { [key: string]: LiveDriverData };
}
const DriverBadge: React.FC<DriverBadgeProps> = ({ driver, position, fastestLapSectors, fastestSectors, fastestLaps, telemetry }) => {
  // initialises the sector values
  const [s1, setS1] = useState<LiveDriverSector>({ driverNum: 0, duration: 0, pbDuration: 0, sectorNum: 0, time: new Date(), currentLap: true });
  const [s2, setS2] = useState<LiveDriverSector>({ driverNum: 0, duration: 0, pbDuration: 0, sectorNum: 0, time: new Date(), currentLap: true });
  const [s3, setS3] = useState<LiveDriverSector>({ driverNum: 0, duration: 0, pbDuration: 0, sectorNum: 0, time: new Date(), currentLap: true });

  // values of whether the sector should be shown (whether it has happened yet)
  const [normalS1, setNormalS1] = useState<boolean>(driver.liveTiming == undefined ? false : driver.liveTiming!.s1);
  const [normalS2, setNormalS2] = useState<boolean>(driver.liveTiming == undefined ? false : driver.liveTiming!.s2);
  const [normalS3, setNormalS3] = useState<boolean>(driver.liveTiming == undefined ? false : driver.liveTiming!.s3);

  // whether to show split or not
  const [split, setSplit] = useState<boolean>(false);

  // inputs to displaying the split
  const [splitProps, setSplitProps] = useState<SplitProps>({ sectorSplit: 0, bestSectorSplit: 0, chasing: "" });

  // finds startup values
  useEffect(() => {
    if (driver.liveTiming != undefined) {
      if (driver.liveTiming.s1 == false) {
        if (normalS3 || normalS2) {
          setNormalS1(false);
          setNormalS2(false);
          setNormalS3(false);
          setSplit(false);
        }
      }

      if (driver.liveTiming.s1) {
        setNormalS1(true);
      }
      if (driver.liveTiming.s2) {
        setNormalS2(true);
      }
      if (driver.liveTiming.s3) {
        setNormalS3(true);
      }
    }
  }, [driver]);

  // updates sector timing
  useEffect(() => {
    if (driver.sectors.length === 0) return;

    let timeout2: ReturnType<typeof setTimeout> | null = null;

    const updateInterval = () => {
      const now = new Date();
      const sectors = driver.sectors;

      let timeUntil = -1;
      let currentS1;
      let currentS2;
      let currentS3;

      for (let i = 0; i < sectors.length; i++) {
        if (sectors[i].time.getTime() <= now.getTime()) {
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
          timeUntil = sectors[i].time.getTime() - now.getTime();
          break;
        }
      }

      // sets new values of each sector
      if (currentS1) {
        setS1(currentS1);
        if (!currentS1.currentLap || (currentS1.duration != s1.duration && s1.duration != 0)) {
          // sets which sectors have been complete
          setNormalS1(true);
          setNormalS2(false);
          setNormalS3(false);
          setSplitProps({ chasing: getFastestDriver(), sectorSplit: s1.duration, bestSectorSplit: getFastestSplit(1) });
          setSplit(true);
          const timeout = setTimeout(() => {
            setSplit(false);
          }, 5000);
        }
      }
      if (currentS2) {
        setS2(currentS2);
        if (!currentS2.currentLap || (currentS2.duration != s2.duration && s2.duration != 0)) {
          // sets which sectors are complete
          setNormalS2(true);
          setNormalS3(false);
          setSplitProps({ chasing: getFastestDriver(), sectorSplit: s1.duration + s2.duration, bestSectorSplit: getFastestSplit(2) });
          setSplit(true);
          const timeout = setTimeout(() => {
            setSplit(false);
          }, 5000);
        }
      }
      if (currentS3) {
        setS3(currentS3);
        if (!currentS3.currentLap || (currentS3.duration != s3.duration && s3.duration != 0)) {
          // sets sector 3 to displayable
          setNormalS3(true);
          setSplitProps({ chasing: getFastestDriver(), sectorSplit: s1.duration + s2.duration + s3.duration, bestSectorSplit: getFastestSplit(3) });
          setSplit(true);
        }
      }

      // waits until next update to change the interval
      if (timeUntil !== -1) {
        timeout2 = setTimeout(updateInterval, timeUntil);
      }
    };

    updateInterval();

    return () => {
      if (timeout2) clearTimeout(timeout2);
    };
  }, [driver.sectors]);

  // finds fastest lap - to compare to
  function getFastestLap(
    laps: Record<string, LiveDriverFastestLap>
  ): LiveDriverFastestLap | undefined {
    const allLaps = Object.values(laps).filter(lap =>
      lap.s1 !== 0 &&
      lap.s2 !== 0 &&
      lap.s3 !== 0
    );
    if (allLaps.length === 0) return undefined;

    return allLaps.reduce((fastest, current) =>
      current.lapTime < fastest.lapTime ? current : fastest
    );
  }

  // gets fastest lap's best sector split
  function getFastestSplit(sector: number): number {
    let fl = getFastestLap(fastestLaps);
    if (fl == undefined) {
      return 0;
    }
    else {
      return (sector >= 1 ? fl.s1 : 0) + (sector >= 2 ? fl.s2 : 0) + (sector >= 3 ? fl.s3 : 0);
    }
  }

  // gets the fastest driver name
  function getFastestDriver(): string {
    let fl = getFastestLap(fastestLaps);
    if (fl == undefined) {
      return "";
    }
    else {
      return telemetry[fl.driverNum.toString()].driver.driver;
    }
  }

  // formats fastest split time
  function getFastestSplitTime(): string {
    let fl = getFastestLap(fastestLaps);
    if (fl == undefined) {
      return "";
    }
    else {
      return formatLapTime((normalS1 || normalS2 || normalS3 ? fl.s2 : 0) + (normalS2 || normalS3 ? fl.s3 : 0) + fl.s1, true);
    }
  }

  console.log(driver.liveTiming);


  return (
    // background container box
    <Box
      sx={{
        bgcolor: '#222',
        color: '#fff',
        borderRadius: 1,
        width: 270,
        height: 170,
        textAlign: 'center',
        boxShadow: 3,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'start',
        justifyContent: 'space-between',
      }}
    >

      <Box
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "start",
          border: "none",
          borderRadius: "8px",
          color: "white",
          fontSize: "18px",
          height: "37px",
          cursor: "pointer",
          backgroundColor: "#FFF3",
          textTransform: "none",
          padding: "12px"
        }}
      >
        {/* position number */}
        <div style={{
          fontSize: "17px",
          marginRight: "10px",
          fontWeight: "bold",
          display: "flex",
          justifyContent: "flex-end",
        }}>
          {position}
        </div>

        {/* team colour */}
        <div style={{
          backgroundColor: driver.driver.teamColour,
          width: "5px",
          height: "26px",
          marginRight: "8px"
        }} />

        {/* driver name */}
        <div style={{ display: "flex", alignItems: "baseline", fontWeight: "bold" }}>
          <span style={{ fontWeight: "bold", fontSize: "17px" }}>
            {driver.driver.driver.split(" ")}
          </span>
        </div>
      </Box>

      {/* shows splits and stopwatch */}
      {driver.liveTiming && (
        split ?
          <SplitDisplay chasing={splitProps.chasing} sectorSplit={((normalS1 || normalS2 || normalS3) ? s1.duration : 0) + ((normalS2 || normalS3) ? s2.duration : 0) + ((normalS3) ? s3.duration : 0)} bestSectorSplit={splitProps.bestSectorSplit} />
          :
          <Box
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            width="100%"
          >
            <Stopwatch startTime={driver.liveTiming.time} />
            {
              getFastestLap(fastestLaps)?.lapTime != 0 &&
              <Box justifyItems={"end"}>
                <Typography variant="body2" fontWeight="bold">
                  {getFastestDriver()}
                </Typography>
                <Typography
                  variant="body2"
                  component="span"
                  fontWeight="bold"
                  color={"#AAA"}
                >
                  {getFastestSplitTime()}
                </Typography>
              </Box>
            }
          </Box>
      )}

      {/* shows bottom 3 sector splits */}
      {driver.liveTiming != undefined &&
        <Box
          height={40}
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",       // ← fill all horizontal space
            // flexGrow: 1,      // ← alternatively, if parent is flex, this will make it expand
          }}
        >
          <Box alignContent={"center"} fontWeight={"bold"} fontFamily={"monospace"} borderRadius={"5px 0px 0px 5px"} width={77} paddingY={0.6} color={(normalS1 || driver.liveTiming.s1) ? (s1.duration <= fastestLapSectors.s1 || fastestLapSectors.s1 == 0) ? "white" : "#333" : "#BBB"} bgcolor={(normalS1 || driver.liveTiming.s1) ? (s1.duration <= fastestSectors.s1 || fastestSectors.s1 == 0) ? "#db34eb" : (s1.duration <= fastestLapSectors.s1 || fastestLapSectors.s1 == 0) ? "#00AA00" : "#CFD600" : "#FFFFFF22"}>{(normalS1 || driver.liveTiming.s1) ? formatLapTime(s1.duration, true) : "S1"}</Box>
          <Box alignContent={"center"} fontWeight={"bold"} fontFamily={"monospace"} width={77} paddingY={0.6} color={((normalS2 || driver.liveTiming.s2) && (normalS1 || driver.liveTiming.s1)) ? (s1.duration + s2.duration <= fastestLapSectors.s1 + fastestLapSectors.s2 || fastestLapSectors.s1 == 0 || fastestLapSectors.s2 == 0 || s2.duration <= fastestSectors.s2) ? "white" : "#333" : "#BBB"} bgcolor={(normalS2 || driver.liveTiming.s2 && (normalS1 || driver.liveTiming.s1)) ? (s2.duration <= fastestSectors.s2 || fastestSectors.s2 == 0) ? "#db34eb" : (s1.duration + s2.duration <= fastestLapSectors.s1 + fastestLapSectors.s2 || fastestLapSectors.s1 == 0 || fastestLapSectors.s2 == 0) ? "#00AA00" : "#CFD600" : "#FFFFFF22"}>{(normalS2 || driver.liveTiming.s2) ? formatLapTime(s1.duration + s2.duration, true) : "S2"}</Box>
          <Box alignContent={"center"} fontWeight={"bold"} fontFamily={"monospace"} borderRadius={"0px 5px 5px 0px"} width={77} paddingY={0.6} color={((normalS3 || driver.liveTiming.s3) && (normalS2 || driver.liveTiming.s2) && (normalS1 || driver.liveTiming.s1)) ? (s1.duration + s2.duration + s3.duration <= fastestLapSectors.s1 + fastestLapSectors.s2 + fastestLapSectors.s3 || fastestLapSectors.s3 == 0 || s3.duration <= fastestSectors.s3 || fastestLapSectors.s1 == 0 || fastestLapSectors.s2 == 0) ? "white" : "#333" : "#BBB"} bgcolor={((normalS3 || driver.liveTiming.s3) && (normalS2 || driver.liveTiming.s2) && (normalS1 || driver.liveTiming.s1)) ? (s3.duration <= fastestSectors.s3 || fastestSectors.s3 == 0) ? "#db34eb" : (s1.duration + s2.duration + s3.duration <= fastestLapSectors.s1 + fastestLapSectors.s2 + fastestLapSectors.s3 || fastestLapSectors.s1 == 0 || fastestLapSectors.s2 == 0 || fastestLapSectors.s3 == 0) ? "#00AA00" : "#CFD600" : "#FFFFFF22"}>{(normalS3 || driver.liveTiming.s3) ? formatLapTime(s1.duration + s2.duration + s3.duration, true) : "S3"}</Box>
        </Box>
      }
    </Box>
  );
};


// displays all DriverBadge's as a row at the bottom
interface DriverPopupBarProps {
  driversSelected: number[];
  telemetry: { [key: string]: LiveDriverData };
  positions: LiveDriverPosition[];
  fastestSectors: FastestSectors;
  fastestLaps: { [key: string]: LiveDriverFastestLap };
}
export const DriverPopupBar: React.FC<DriverPopupBarProps> = ({ driversSelected, telemetry, positions, fastestSectors, fastestLaps }) => {

  // shows current positions to display
  const [currentPositions, setCurrentPositions] = useState<number[]>([]);

  // updates positions whenever their's an update
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const updatePositions = () => {
      let currentPos: number[] = [];
      let timeUntil: number = -1;
      for (let i = 0; i < positions.length; i++) {
        if (positions[i].time <= new Date()) {
          currentPos = positions[i].driverNums;
        }
        else {
          timeUntil = (positions[i].time.getTime() - (new Date()).getTime());
          break;
        }
      }

      setCurrentPositions(currentPos);

      if (timeUntil != -1) {
        timeout = setTimeout(updatePositions, timeUntil);
      }
    };

    updatePositions();
  }, [positions]);

  // displays the row at the bottom
  return (
    <Box
      component="footer"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        pointerEvents: 'none',
        zIndex: (theme) => theme.zIndex.tooltip,
        py: 1,
        backgroundColor: 'transparent',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Stack direction="row" spacing={1}>
        {driversSelected.map((driver) => (
          <DriverBadge fastestLaps={fastestLaps} key={driver} driver={telemetry[driver.toString()]} position={currentPositions.indexOf(driver) + 1} fastestLapSectors={fastestLaps[driver.toString()]} fastestSectors={fastestSectors} telemetry={telemetry} />
        ))}
      </Stack>
    </Box>
  );
};