import { ref, getBlob, StorageReference } from "firebase/storage";
import { storage } from "../firebaseConfig";

// defines constructor standings
export interface ConstructorStanding {
  name: string;
  points: number;
  wins: number;
  interval: number;
  colour: string;
}

// defines driver standings
export interface DriverStanding {
  name: string;
  points: number;
  wins: number;
  interval: number;
  team: string;
  teamColour: string;
}

export interface Standings {
  drivers: DriverStanding[];
  teams: ConstructorStanding[];
}

// fetches both driver and constructor standings
export async function fetchStandings(year: string): Promise<Standings> {
  try {
    // download's standings from cloud storage
    const sessionRef: StorageReference = ref(storage, `home/standings${year}.json`);
    const blob: Blob = await getBlob(sessionRef);
    const text: string = await blob.text();
    const jsonData: any = JSON.parse(text);

    let drivers: DriverStanding[] = [];
    let teams: ConstructorStanding[] = [];

    // assigns data to drivers
    for (let i = 0; i < jsonData["drivers"].length; i++) {
      let interval = 0;
      if (i > 0) {
        // if not leader, find points gap to next driver
        interval = jsonData["drivers"][i - 1][0] - jsonData["drivers"][i][0];
      }
      // pushes data to drivers
      drivers.push({ name: jsonData["drivers"][i][2], points: jsonData["drivers"][i][0], wins: jsonData["drivers"][i][1], interval: interval, team: jsonData["drivers"][i][3], teamColour: jsonData["drivers"][i][4] });
    }

    // assigns data to teams
    for (let i = 0; i < jsonData["constructors"].length; i++) {
      let interval = 0;
      if (i > 0) {
        // if not leader, find points gap to next team
        interval = jsonData["constructors"][i - 1][0] - jsonData["constructors"][i][0];
      }
      // pushes data to teams
      teams.push({ name: jsonData["constructors"][i][2], points: jsonData["constructors"][i][0], wins: jsonData["constructors"][i][1], interval: interval, colour: jsonData["constructors"][i][3] });
    }

    return { drivers: drivers, teams: teams };
  } catch (error) {
    console.error("Error fetching session data:", error);
    throw error;
  }
}