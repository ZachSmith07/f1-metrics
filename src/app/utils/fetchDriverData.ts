import { ref, listAll, getBlob, StorageReference } from "firebase/storage";
import { storage } from "../firebaseConfig";
import { DriverData } from "../classes/driverData";

// retrieves driver data from json and converts to DriverData
export async function fetchDriverData(year: string, round: string, session: string, driver: string): Promise<DriverData> {
    try {
        // loading the .json file from Cloud Storage
        const sessionRef: StorageReference = ref(storage, `F1DataN/${year}/${round}/${session}/${driver}/driverData.json`);
        const blob: Blob = await getBlob(sessionRef);
        const text: string = await blob.text();
        const jsonData: any = JSON.parse(text);

        // converts from list to DriverData
        const driverData = DriverData.fromList(jsonData);
        return driverData;
    } catch (error) {
        // Throws error in case of missing data, or other reasons
        console.error("Error fetching session data:", error);
        throw error;
    }
}