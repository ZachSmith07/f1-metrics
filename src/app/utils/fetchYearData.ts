import { ref, getBlob, StorageReference } from "firebase/storage";
import { storage } from "../firebaseConfig";

export class ResultsEvent {
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

	constructor(
		event: string,
		country: string,
		date: string,
		sessions: string[],
		round: number,
		top3: string[],
		topTeams: [string, number][],
		championshipLeader: [string, number],
		topDriver: [string, number],
		fl: string,
	) {
		this.event = event;
		this.country = country;
		this.date = date.replace(" ", "T").replace(" UTC", "Z");
		this.sessions = sessions;
		this.top3 = top3;
		for (let i = 0; i < topTeams!.length; i++) {
			if (topTeams![i][0] === "Red Bull Racing") {
				topTeams![i][0] = "Red Bull";
			}
		}
		this.topTeams = topTeams;
		this.topDriver = topDriver;
		this.championshipLeader = championshipLeader;
		this.fl = fl;
		this.round = round;
	}

	toString(): string {
		return [
			`ResultsEvent: ${this.event} (${this.country})`,
			`Date: ${this.date}, Round: ${this.round}`,
			`Sessions: ${this.sessions.join(", ")}`,
			`Top 3: ${this.top3.join(", ")}`,
			`Top Teams: ${this.topTeams.map(t => `${t[0]} (${t[1]})`).join(", ")}`,
			`Championship Leader: ${this.championshipLeader[0]} (${this.championshipLeader[1]})`,
			`Top Driver: ${this.topDriver[0]} (${this.topDriver[1]})`,
			`Fastest Lap: ${this.fl}`
		].join("\n");
	}
}

export class EmptyEvent {
	event: string;
	country: string;
	date: string;
	sessions: [string, string, boolean][];
	round: number;

	constructor(
		event: string,
		country: string,
		date: string,
		sessions: [string, string, boolean][],
		round: number,
	) {
		this.event = event;
		this.country = country;
		this.date = date.replace(" ", "T").replace(" UTC", "Z");
		let sessionsCopy = sessions;
		for (let i = 0; i < sessionsCopy.length; i++) {
			const session = sessionsCopy[i];
			if (Array.isArray(session)) {
				session[1] = session[1].replace(" ", "T").replace(" UTC", "Z");
			}
		}
		this.sessions = sessions;
		this.round = round;
	}

	toString(): string {
		return [
			`EmptyEvent: ${this.event} (${this.country})`,
			`Date: ${this.date}, Round: ${this.round}`,
			`Sessions: ${this.sessions.map(s => `${s[0]} @ ${s[1]} (confirmed: ${s[2]})`).join(", ")}`
		].join("\n");
	}
}


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
		if (map.top3 == undefined)
		{
			// FUTURE EVENT
			return new EmptyEvent(map.event, map.country, map.date, map.sessions as [string, string, boolean][], 1);
		}
		else
		{
			// RESULTS EVENT
			return new ResultsEvent(map.event, map.country, map.date, map.sessions as string[], 1, map.top3, map.topTeams!, map.driversLeader!, map.topDriver!, map.fl!);
		}
}

// export class F1Event {
// 	event: string;
// 	country: string;
// 	date: string;
// 	sessions: string[] | string[][];
// 	top3: string[] | undefined;
// 	championshipLeader: [string, number] | undefined;
// 	topTeams: [string, number][] | undefined;
// 	topDriver: [string, number] | undefined;
// 	fl: string | undefined;
// 	round: number;

// 	constructor(
// 		event: string,
// 		country: string,
// 		date: string,
// 		sessions: string[] | string[][],
// 		round: number,
// 		top3?: string[],
// 		topTeams?: [string, number][],
// 		championshipLeader?: [string, number],
// 		topDriver?: [string, number],
// 		fl?: string,
// 	) {
// 		this.event = event;
// 		this.country = country;
// 		this.date = date.replace(" ", "T").replace(" UTC", "Z");
// 		let sessionsCopy = sessions;
// 		for (let i = 0; i < sessionsCopy.length; i++) {
// 			const session = sessionsCopy[i];
// 			if (Array.isArray(session)) {
// 				// Now TypeScript knows session is string[]
// 				session[1] = session[1].replace(" ", "T").replace(" UTC", "Z");
// 			}
// 		}
// 		this.sessions = sessions;
// 		this.top3 = top3;
// 		if (topTeams != undefined) {
// 			let teams = topTeams;
// 			for (let i = 0; i < topTeams!.length; i++) {
// 				if (topTeams![i][0] == "Red Bull Racing") {
// 					topTeams![i][0] = "Red Bull";
// 				}
// 			}
// 		}
// 		this.topTeams = topTeams;
// 		this.topDriver = topDriver;
// 		this.championshipLeader = championshipLeader;
// 		this.fl = fl;
// 		this.round = round;
// 	}

// 	// Static method to create an instance from a map (plain object)
// 	static fromMap(map: {
// 		event: string;
// 		country: string;
// 		date: string;
// 		sessions: string[] | string[][];
// 		top3?: string[];
// 		topTeams?: [string, number][];
// 		driversLeader?: [string, number];
// 		topDriver?: [string, number];
// 		fl?: string;
// 	}): F1Event {
// 		return new F1Event(
// 			map.event,
// 			map.country,
// 			map.date,
// 			map.sessions,
// 			1,
// 			map.top3,
// 			map.topTeams,
// 			map.driversLeader,
// 			map.topDriver,
// 			map.fl
// 		);
// 	}

// 	// Method to return a string representation of the object
// 	toString(): string {
// 		return `F1 Event: ${this.event} (${this.country})\n` +
// 			`Date: ${this.date}\n` +
// 			`Sessions: ${this.sessions.join(", ")}\n` +
// 			`Top 3 Drivers: ${this.top3?.join(", ") ?? "N/A"}\n` +
// 			`Top Teams: ${this.topTeams?.map(([team, points]) => `${team} (${points} points)`).join(", ") ?? "N/A"}\n` +
// 			`Top Driver: ${this.topDriver ? `${this.topDriver[0]} (${this.topDriver[1]} points)` : "N/A"}\n` +
// 			`Fastest Lap Driver: ${this.fl ?? "N/A"}`;
// 	}
// }

export async function fetchYearSchedule(year: string): Promise<(EmptyEvent | ResultsEvent)[]> {
	try {
		const sessionRef: StorageReference = ref(storage, `home/${year}.json`);
		const blob: Blob = await getBlob(sessionRef);
		const text: string = await blob.text();
		const jsonData: any = JSON.parse(text);

		let events: (EmptyEvent | ResultsEvent)[] = [];

		for (let i = 0; i < jsonData.length; i++) {
			events.push(mapToEvent(jsonData[i]));
			events[i].round = i;
		}

		return events;
	} catch (error) {
		console.error("Error fetching session data:", error);
		throw error;
	}
}