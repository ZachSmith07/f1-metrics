import { ref, getBlob, StorageReference } from "firebase/storage";
import { storage } from "../firebaseConfig";

// defines event which has already happened and the results are already fetched
export interface ResultsEvent {
  event: string;
  country: string;
  date: string;
  sessions: string[];
  top3: string[];
  championshipLeader: [string, number];
  topTeams: [string, number][];
  topDriver: [string, number];
  fl: string;
  round: number;
}

// defines event which hasn't happened yet or doesn't have the results for the race
export interface EmptyEvent {
  event: string;
  country: string;
  date: string;
  sessions: [string, string, boolean][];
  round: number;
}

// converts map to either Event's (depending on the information provided)
function mapToEvent(map: {
  event: string;
  country: string;
  date: string;
  sessions: string[] | [string, string, boolean][];
  top3?: string[];
  topTeams?: [string, number][];
  driversLeader?: [string, number];
  topDriver?: [string, number];
  fl?: string;
}): EmptyEvent | ResultsEvent {
  if (map.top3 == undefined) {
    // FUTURE EVENT
    return {event: map.event, country: map.country, date: map.date, sessions: map.sessions as [string, string, boolean][], round: 1};
  }
  else {
    // RESULTS EVENT
    return {event: map.event, country: map.country, date: map.date, sessions: map.sessions as string[], round: 1, top3: map.top3, topTeams: map.topTeams!, championshipLeader: map.driversLeader!, topDriver: map.topDriver!, fl: map.fl!};
  }
}

// fetches the schedule
export async function fetchYearSchedule(year: string): Promise<(EmptyEvent | ResultsEvent)[]> {
  try {
    // downloads .json containing schedule
    const sessionRef: StorageReference = ref(storage, `home/${year}.json`);
    const blob: Blob = await getBlob(sessionRef);
    const text: string = await blob.text();
    const jsonData: any = JSON.parse(text);

    // defines events as a list of EmptyEvent's and ResultsEvent's
    let events: (EmptyEvent | ResultsEvent)[] = [];

    for (let i = 1; i < jsonData.length; i++) {
      // converts each event into their classes
      events.push(mapToEvent(jsonData[i]));
      events[i - 1].round = i;
    }

    return events;
  } catch (error) {
    console.error("Error fetching session data:", error);
    throw error;
  }
}