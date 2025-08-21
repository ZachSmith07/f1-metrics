import { getStorage, ref, getBytes, StorageReference, getBlob } from "firebase/storage";
import { storage } from "../firebaseConfig";
import { binToInt } from "./binaryHandling";

// Defines live session data
export class LiveSession {
  session: string;
  name: string;
  rotation: number;
  country: string;
  laps: number;
  marshalSectors: number[];
  startDate: Date;

  // Constructor - initialises LiveSession
  constructor(session: string, name: string, rotation: number, country: string, laps: number, marshalSectors: number[], date: Date) {
    this.session = session;
    this.name = name;
    this.rotation = rotation;
    this.country = country;
    this.laps = laps;
    this.marshalSectors = marshalSectors;
    const offsetMilliseconds = date.getTimezoneOffset() * 60 * 1000;
    const normalizedDate = new Date(date.getTime() + offsetMilliseconds);
    this.startDate = normalizedDate;
  }

  // converts to string for console logging
  toString(): string {
    return `LiveSession(session: ${this.session}, name: ${this.name}, country: ${this.country}, laps: ${this.laps})`;
  }
}

// retrieves LiveSession from cloud storage
export async function getLiveSession(year: String, eventName: String, sessionName: String): Promise<LiveSession> {
  // loads and decodes the json
  const storage = getStorage();
  const sessionRef = ref(storage, `LiveData/${year}/${eventName}/${sessionName}/session.json`);
  const data = await getBytes(sessionRef);
  const jsonStr = new TextDecoder("utf-8").decode(data);
  const jsonData = JSON.parse(jsonStr);

  // returns as a LiveSession
  return new LiveSession(
    jsonData["session"],
    jsonData["event"],
    jsonData["rotation"],
    jsonData["country"],
    jsonData["laps"],
    jsonData["marshals"],
    new Date(new Date(jsonData["start"]).getTime())
  );
}

// Defines live driver data
export class LiveDriver {
  driver: string;
  teamColour: string;
  driverNumber: number;
  selected: boolean;

  // initialises driver
  constructor(driver: string, teamColour: string, driverNumber: number) {
    this.driver = driver;
    this.teamColour = "#" + teamColour;
    this.driverNumber = driverNumber;
    this.selected = false;
  }

  toString(): string {
    return `LiveDriver(driver: ${this.driver}, teamColour: ${this.teamColour}, driverNumber: ${this.driverNumber})`;
  }

  // constructs from json list of drivers
  static fromJsonData(jsonData: any): LiveDriver[] {
    let drivers: LiveDriver[] = [];
    for (let i = 0; i < jsonData.length; i++) {
      drivers.push(new LiveDriver(jsonData[i][0], jsonData[i][1], jsonData[i][2]));
    }
    return drivers;
  }
}

// retrieves data about all drivers
export async function getLiveDrivers(year: String, eventName: String, sessionName: String): Promise<LiveDriver[]> {
  // fetches data from json
  const storage = getStorage();
  const sessionRef = ref(storage, `LiveData/${year}/${eventName}/${sessionName}/drivers.json`);
  const data = await getBytes(sessionRef);
  const jsonStr = new TextDecoder("utf-8").decode(data);
  const jsonData = JSON.parse(jsonStr);

  // converts to list of drivers and returns
  let drivers: LiveDriver[] = LiveDriver.fromJsonData(jsonData)
  return drivers;
}

// defining telemetry data structure
export interface LiveTelemetry {
  speed: number;
  throttle: number;
  brake: boolean;
  drs: number;
  gear: number;
  time: Date;
  driverNum: number;
}

// defining location data structure
export interface LiveLocation {
  x: number;
  y: number;
  time: Date;
  driverNum: number;
}

// defining position data structure
export interface LiveDriverPosition {
  driverNums: number[];
  time: Date;
}

// defining interval data structure
export interface LiveDriverInterval {
  driverNum: number;
  gapToLeader: string;
  interval: string;
  time: Date;
}

// defining timing sector data structure
export interface LiveDriverSector {
  driverNum: number;
  duration: number;
  pbDuration: number;
  sectorNum: number;
  time: Date;
  currentLap: boolean;
}

// defining driver live-timing data structure
export interface LiveDriverSectorTiming {
  driverNum: number;
  time: Date;
  s1: boolean;
  s2: boolean;
  s3: boolean;
}

// defining tyre data structure
export interface LiveDriverTyre {
  driverNum: number;
  tyreAge: number;
  compound: string;
  time: Date;
}

// defining PB lap-timing data structure
export interface LiveDriverFastestLap {
  driverNum: number;
  s1: number;
  s2: number;
  s3: number;
  lapTime: number;
}

// fastest sectors data structure
export interface FastestSectors {
  s1: number;
  s2: number;
  s3: number;
}

// defines all data packaged
export interface LiveData {
  telemetry: LiveTelemetry[];
  positions: LiveLocation[];
  driverPositions: LiveDriverPosition[];
  driverIntervals: LiveDriverInterval[];
  driverSectors: LiveDriverSector[];
  driverTyres: LiveDriverTyre[];
  lapNumber: number;
  trackState: number;
  driverLiveTiming: LiveDriverSectorTiming[];
  fastestSectors: FastestSectors;
  fastestLaps: { [key: string]: LiveDriverFastestLap };
  driversActive: number;
}

// formats date to LiveData name
function formatDateCustom(date: Date): string {
  const pad = (n: number, z = 2) => n.toString().padStart(z, '0');

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  const milliseconds = date.getUTCMilliseconds();

  // Convert milliseconds to microseconds string
  let microseconds = "." + pad(milliseconds, 3) + '000';

  if (milliseconds == 0) {
    microseconds = "";
  }

  // returns custom format
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${microseconds}+00:00.ld`;
}


// formats time for interval
const formatTime = (value: number) => {
  if (value == 0) {
    // return default without data
    return "-.---";
  }
  else {
    // if value should be given in minutes
    if (value >= 60) {
      return `${Math.floor(value / 60)}:${(value % 60).toFixed(3)}`;
    }
    // if values is given in seconds
    else {
      return `+${value.toFixed(3)}`;
    }
  }
};


// function fetching all live data from a 2.5 second frame
export async function getLiveData(time: Date, marshalSectorsNum: number, year: String, eventName: String, sessionName: String): Promise<LiveData> {
  // fetches live data from Cloud Storage
  const sessionRef: StorageReference = ref(storage, `LiveData/${year}/${eventName}/${sessionName}/${formatDateCustom(time)}`);
  const blob = await getBlob(sessionRef);
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // converting to list of booleans
  let boolList: boolean[] = [];
  for (const byte of uint8Array) {
    for (let bit = 7; bit >= 0; bit--) {
      boolList.push((byte & (1 << bit)) !== 0);
    }
  }

  // Decoding telemetry data
  // Finds length of array of telemetry
  let length = binToInt(boolList.splice(0, 12));
  // initialises empty list of telemetry
  let telem: LiveTelemetry[] = [];

  // decoding the actual telemetry
  for (let i = 0; i < length; i++) {
    const driverNum = binToInt(boolList.splice(0, 7));
    const speed = binToInt(boolList.splice(0, 9));
    const throttle = binToInt(boolList.splice(0, 7));
    const brake = boolList.splice(0, 1)[0];
    const drs = binToInt(boolList.splice(0, 2));
    const gear = binToInt(boolList.splice(0, 3)) + 1;
    const timeAdd = binToInt(boolList.splice(0, 12));
    const timeSplit = new Date(time.getTime() + timeAdd); // time add - adds in the delay

    // adds the frame to the list of telemetry
    telem.push({ driverNum: driverNum, speed: speed, throttle: throttle, brake: brake, drs: drs, gear: gear, time: timeSplit });
  }


  // Decoding location data
  // length of location data array
  length = binToInt(boolList.splice(0, 12));
  let positions: LiveLocation[] = [];

  // decoding the locations
  for (let i = 0; i < length; i++) {
    const driverNum = binToInt(boolList.splice(0, 7))
    const x = binToInt(boolList.splice(0, 16), true);
    const y = binToInt(boolList.splice(0, 16), true);
    const timeAdd = binToInt(boolList.splice(0, 12));
    const timeSplit = new Date(time.getTime() + timeAdd);
    // adding the location frames
    positions.push({ driverNum: driverNum, x: -x, y: y, time: timeSplit });
  }


  // Decoding driver position ranking
  length = binToInt(boolList.splice(0, 7));
  let driverPositions: LiveDriverPosition[] = [];

  for (let i = 0; i < length; i++) {
    const timeAdd = binToInt(boolList.splice(0, 12));

    // finds length of driver position's
    let driverCount = binToInt(boolList.splice(0, 5));
    // decodes list of driver numbers
    let nums: number[] = [];
    for (let j = 0; j < driverCount; j++) {
      const driverNum = binToInt(boolList.splice(0, 7));
      nums.push(driverNum);
    }
    driverPositions.push({ driverNums: nums, time: new Date(time.getTime() + timeAdd) });
  }


  // Decoding driver timing intervals
  let driverIntervals: LiveDriverInterval[] = [];
  length = binToInt(boolList.splice(0, 8));

  for (let i = 0; i < length; i++) {
    let driverNum = binToInt(boolList.splice(0, 7));
    let gapToLeader: string = "0";
    let interval: string = "0";
    // Checks if lapped by the leader
    let leaderLapped = boolList.splice(0, 1)[0];
    if (leaderLapped) {
      // if is lapped it returns how lapped they are
      gapToLeader = `${binToInt(boolList.splice(0, 8))}L`;
    }
    else {
      // otherwise sets a time gap
      gapToLeader = formatTime(binToInt(boolList.splice(0, 20)) / 1000);
    }
    // Checks if lapped by the next car ahead
    let intervalLapped = boolList.splice(0, 1)[0];
    if (intervalLapped) {
      // if is lapped it returns how lapped they are
      gapToLeader = `${binToInt(boolList.splice(0, 8))}L`;
    }
    else {
      // otherwise sets a time gap
      interval = formatTime(binToInt(boolList.splice(0, 20)) / 1000);
    }
    const timeAdd = binToInt(boolList.splice(0, 12));
    let timestamp = new Date(time.getTime() + timeAdd);
    driverIntervals.push({ driverNum: driverNum, gapToLeader: gapToLeader.toString(), interval: interval.toString(), time: timestamp });
  }


  // Decoding live-timing
  let driverSectors: LiveDriverSector[] = [];
  length = binToInt(boolList.splice(0, 8));

  for (let i = 0; i < length; i++) {
    let driverNum = binToInt(boolList.splice(0, 7));
    let duration = binToInt(boolList.splice(0, 24)) / 1000;
    let pbDuration = binToInt(boolList.splice(0, 24)) / 1000;
    let sectorNum = binToInt(boolList.splice(0, 2));
    const timeAdd = binToInt(boolList.splice(0, 12));
    let timestamp = new Date(time.getTime() + timeAdd);
    driverSectors.push({ driverNum: driverNum, duration: duration, pbDuration: pbDuration, sectorNum: sectorNum, time: timestamp, currentLap: timestamp.getTime() % 2500 == 0 });
  }

  // Decodes tyres
  let driverTyres: LiveDriverTyre[] = [];
  length = binToInt(boolList.splice(0, 5));
  let compounds = ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET", "UNKNOWN"];

  for (let i = 0; i < length; i++) {
    let driverNum = binToInt(boolList.splice(0, 7));
    let compound = compounds[binToInt(boolList.splice(0, 3))]; // sets compound from pre-set indexes
    let tyreAge = binToInt(boolList.splice(0, 7));
    driverTyres.push({ driverNum: driverNum, compound: compound, tyreAge: tyreAge, time: time });
  }


  // Decodes each driver's live-timing display (if each sector has occured)
  let driverLiveTiming: LiveDriverSectorTiming[] = [];

  length = binToInt(boolList.splice(0, 5));
  for (let i = 0; i < length; i++) {
    let driverNum = binToInt(boolList.splice(0, 7));
    let msBefore = binToInt(boolList.splice(0, 24));
    let s1 = boolList.splice(0, 1)[0];
    let s2 = boolList.splice(0, 1)[0];
    let s3 = boolList.splice(0, 1)[0];
    driverLiveTiming.push({ driverNum: driverNum, time: new Date(time.getTime() - msBefore), s1: s1, s2: s2, s3: s3 });
  }


  // decoding each drivers fastest lap data
  length = binToInt(boolList.splice(0, 5));
  let fastestLaps: { [key: string]: LiveDriverFastestLap } = {};
  for (let i = 0; i < length; i++) {
    let driverNum = binToInt(boolList.splice(0, 7));
    let s1 = binToInt(boolList.splice(0, 19)) / 1000;
    let s2 = binToInt(boolList.splice(0, 19)) / 1000;
    let s3 = binToInt(boolList.splice(0, 19)) / 1000;
    let fl = s1 + s2 + s3; // lap time is total of all sectors
    fastestLaps[driverNum.toString()] = { s1: s1, s2: s2, s3: s3, lapTime: fl, driverNum: driverNum };
  }

  // calculates fastest sectors
  const fastestS1 = binToInt(boolList.splice(0, 17)) / 1000;
  const fastestS2 = binToInt(boolList.splice(0, 17)) / 1000;
  const fastestS3 = binToInt(boolList.splice(0, 17)) / 1000;

  // decodes other live data
  let lapNumber = binToInt(boolList.splice(0, 8));
  let trackState = binToInt(boolList.splice(0, 3));
  let qualiNum = binToInt(boolList.splice(0, 2));

  let nOfDrivers = [20, 15, 10][qualiNum - 1]; // finds number of drivers still in the session from qualifying session (Q1, Q2, Q3)

  return { telemetry: telem, positions: positions, driverPositions: driverPositions, driverIntervals: driverIntervals, driverSectors: driverSectors, driverTyres: driverTyres, lapNumber: lapNumber, trackState: trackState, driverLiveTiming: driverLiveTiming, fastestLaps: fastestLaps, fastestSectors: { s1: fastestS1, s2: fastestS2, s3: fastestS3 }, driversActive: nOfDrivers };
}

// Interface of lap path positions
export interface Pos {
  x: number;
  y: number;
}

// Fetches from cloud storage the track map of this session
export async function getTrackMap(year: String, eventName: String, sessionName: String): Promise<Pos[]> {
  const sessionRef: StorageReference = ref(storage, `LiveData/${year}/${eventName}/${sessionName}/map.tm`);
  const blob = await getBlob(sessionRef);
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  let boolList: boolean[] = [];

  for (const byte of uint8Array) {
    for (let bit = 7; bit >= 0; bit--) {
      boolList.push((byte & (1 << bit)) !== 0);
    }
  }

  let trackMap: Pos[] = [];
  while (boolList.length > 0) {
    const x = binToInt(boolList.splice(0, 16), true) * -1;
    const y = binToInt(boolList.splice(0, 16), true);
    trackMap.push({ x: x, y: y });
  }

  // returns list of points of a track map
  return trackMap;
}