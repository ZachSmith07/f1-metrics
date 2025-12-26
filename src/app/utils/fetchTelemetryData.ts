import { ref, getBlob, StorageReference } from "firebase/storage";
import { storage } from "../firebaseConfig";
import { TelemetryFrame } from "../classes/telemetryData";
import { binToInt } from "../utils/binaryHandling";


export async function fetchTelemetryData(year: string, round: string, session: string, driver: string, lapNumber: number, lapTime: number): Promise<TelemetryFrame[]> {
    try {
        // fetches lap telemetry data
        const sessionRef: StorageReference = ref(storage, `F1DataN/${year}/${round}/${session}/${driver}/${lapNumber}.f1`);
        const blob = await getBlob(sessionRef);
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // converts data to list of booleans
        let boolList: boolean[] = [];
        for (const byte of uint8Array) {
            for (let bit = 7; bit >= 0; bit--) {
                boolList.push((byte & (1 << bit)) !== 0);
            }
        }

        // finds length of telemetry frames
        const length = binToInt(boolList.splice(0, 20));

        // decodes speeds from binary
        let speeds = [];
        for (let i = 0; i < length; i++) {
            // adds to speeds by converting 9-bits of binary
            speeds.push(binToInt(boolList.splice(0, 9)));
        }
        // decodes gears
        let gears = [];
        for (let i = 0; i < length; i++) {
            gears.push(binToInt(boolList.splice(0, 3)) + 1);
        }
        // decodes throttle
        let throttles = [];
        for (let i = 0; i < length; i++) {
            throttles.push(binToInt(boolList.splice(0, 7)));
        }
        // decodes braking
        let brakes = [];
        for (let i = 0; i < length; i++) {
            brakes.push(boolList.splice(0, 1)[0]);
        }
        // decodes drs activation
        let drs = [];
        for (let i = 0; i < length; i++) {
            drs.push(boolList.splice(0, 1)[0]);
        }
        // decodes x-positions
        let x = [];
        for (let i = 0; i < length; i++) {
            // adds to x-positions by decoding a signed 16-bit integer
            x.push(-binToInt(boolList.splice(0, 16), true));
        }
        // decodes y-positions
        let y = [];
        for (let i = 0; i < length; i++) {
            y.push(binToInt(boolList.splice(0, 16), true));
        }
        // decodes times
        let times: number[] = [];
        for (let i = 0; i < length; i++) {
            let time = binToInt(boolList.splice(0, 10)) / 1000;
            if (i == 0) {
                times.push(time);
            }
            else {
                // adds difference in time to last time calculated
                times.push(time + times[times.length - 1]);
            }
        }

        // calculates relative distance
        
        let fullDistances: number[] = [speeds[0] * times[0]];
        for (let i = 1; i < speeds.length; i++) {
            // numerical integration to estimate distances
            let distance = (speeds[i] + speeds[i - 1]) / 2 * (times[i] - times[i - 1]);
            fullDistances.push(distance + fullDistances[fullDistances.length - 1]);
        }
        // gets totalDistance so can divide distance by it to get relative distance
        let totalDistance = fullDistances[fullDistances.length - 1] * (lapTime / times[times.length - 1]);
        if (lapTime == 9999) {
            totalDistance = fullDistances[fullDistances.length - 1]
        }
        // calculates relativeDistance
        let relativeDistances: number[] = [];
        for (let i = 0; i < fullDistances.length; i++) {
            relativeDistances.push(fullDistances[i] / totalDistance);
        }

        // returns the telemetry from decoded data
        return TelemetryFrame.fromList([speeds, gears, throttles, brakes, drs, x, y, times, relativeDistances]);

    } catch (error) {
        console.error("Error fetching session data:", error);
        return [];
    }
}