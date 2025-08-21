import { ref, listAll, getBlob, StorageReference } from "firebase/storage";
import { storage } from "../firebaseConfig";
import { LapData } from "../classes/lapData";
import { DriverData } from "../classes/driverData";

// defining session data for analysis - DriverData and LapData
interface SessionData {
  driverIds: string[];
  allLapsData: LapData[][];
  driversData: DriverData[];
}

// fetches and returns SessionData
export async function fetchSessionData(year: string, round: string, session: string): Promise<SessionData> {
  try {
    // reference to the session's location
    const sessionRef: StorageReference = ref(storage, `F1DataN/${year}/${round}/${session}`);

    // gets all directory paths inside of the session's folder (which is all driver names)
    const drivers = await listAll(sessionRef);
    const prefixesList: string[] = drivers.prefixes.map((prefixRef: StorageReference) => prefixRef.fullPath);

    // pushes all paths required to download to jsonDownloads, and stores the driverIds
    const jsonDownloads: string[] = [];
    const driverIds: string[] = prefixesList.map((prefix: string) => {
      jsonDownloads.push(`${prefix}/lapsData.json`);
      jsonDownloads.push(`${prefix}/driverData.json`);
      const splitEnd: string[] = prefix.split("/");
      return splitEnd[splitEnd.length - 1];
    });

    // downloads all json data from jsonDownloads path's
    const downloadPromises: Promise<any>[] = jsonDownloads.map(async (filePath: string) => {
      const fileRef: StorageReference = ref(storage, filePath);
      const blob: Blob = await getBlob(fileRef);
      const text: string = await blob.text();
      const jsonData: any = JSON.parse(text);
      return jsonData;
    });
    const allJsonData: any[] = await Promise.all(downloadPromises);

    // converts the json data to LapData and DriverData
    const allLapsData: LapData[][] = [];
    const driversData: DriverData[] = [];
    for (let i = 0; i < allJsonData.length / 2; i++) {
      allLapsData.push(LapData.fromJsonList(allJsonData[i * 2]));
      driversData.push(DriverData.fromList(allJsonData[i * 2 + 1]));
    }

    return {
      driverIds,
      allLapsData,
      driversData,
    };
  } catch (error) {
    console.error("Error fetching session data:", error);
    throw error;
  }
}