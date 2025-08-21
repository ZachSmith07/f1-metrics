import { ref, getBlob, StorageReference } from "firebase/storage";
import { storage } from "../firebaseConfig";

// Defines results for a race or sprint
export interface RaceResult {
  name: string;
  points: number;
  time: number; // time/gap
  fastestLap: number;
  gridPos: number;
  status: string;
  lapsCompleted: number;
  position: number;
  team: string;
}

// Defines results for qualifying (or sprint qualifying)
export interface QualiResult {
  name: string;
  team: string;
  q1: number;
  q2: number;
  q3: number;
  laps: number;
  position: number;
}

// Defines practice result data
export interface PracticeResult {
  name: string;
  team: string;
  fastestLap: number;
  laps: number;
  position: number;
}

// Fetches race result from .json on Cloud Storage
export async function fetchRaceResult(year: string, round: string, session: string): Promise<RaceResult[]> {
  try {
    // fetches and decodes json
    const sessionRef: StorageReference = ref(storage, `F1DataN/${year}/${round}/${session}/results.json`);
    const blob: Blob = await getBlob(sessionRef);
    const text: string = await blob.text();
    const jsonData: any = JSON.parse(text);

    let results: RaceResult[] = [];

    // goes through each row's (driver's) results
    for (let i = 0; i < jsonData.length; i++) {
      const arr = jsonData[i];
      // adding driver's result to the list
      results.push({ name: arr[0], points: arr[1], time: arr[2], fastestLap: arr[3], gridPos: arr[4], status: arr[5], lapsCompleted: arr[6], team: arr[7], position: i + 1 });
    }

    return results;
  } catch (error) {
    console.error("Error fetching result data:", error);
    throw error;
  }
}

export async function fetchQualiResult(year: string, round: string, session: string): Promise<QualiResult[]> {
  try {
    // fetches json
    const sessionRef: StorageReference = ref(storage, `F1DataN/${year}/${round}/${session}/results.json`);
    const blob: Blob = await getBlob(sessionRef);
    const text: string = await blob.text();
    const jsonData: any = JSON.parse(text);

    let results: QualiResult[] = [];

    // goes through each driver
    for (let i = 0; i < jsonData.length; i++) {
      const arr = jsonData[i];
      // adds driver's result to the list
      results.push({ name: arr[0], team: arr[1], q1: arr[2], q2: arr[3], q3: arr[4], laps: arr[5], position: i + 1 });
    }

    return results;
  } catch (error) {
    console.error("Error fetching session data:", error);
    throw error;
  }
}


export async function fetchPracticeResult(year: string, round: string, session: string): Promise<PracticeResult[]> {
  try {
    // fetches .json
    const sessionRef: StorageReference = ref(storage, `F1DataN/${year}/${round}/${session}/results.json`);
    const blob: Blob = await getBlob(sessionRef);
    const text: string = await blob.text();
    const jsonData: any = JSON.parse(text);

    let results: PracticeResult[] = [];

    for (let i = 0; i < jsonData.length; i++) {
      // adds driver's row to results
      const arr = jsonData[i];
      results.push({ name: arr[0], team: arr[1], fastestLap: arr[2], laps: arr[3], position: i + 1 });
    }

    return results;
  } catch (error) {
    console.error("Error fetching session data:", error);
    throw error;
  }
}