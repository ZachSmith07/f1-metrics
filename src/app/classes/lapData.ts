export class LapData {
  // core timing info
  time: number;
  lapTime: number;
  lapNumber: number;
  sector1Time: number;
  sector2Time: number;
  sector3Time: number;

  // tyre info
  compound: string;
  tyreLife: number;
  freshTyre: boolean;
  stint: number;

  // telemetry data
  minSpeed: number;
  maxSpeed: number;
  maxDrs: boolean; // if max speed was achieved with DRS
  throttle: number; // percentage time of throttle at 100%

  position: number; // position at end of lap
  deleted: boolean; // if lap was invalid
  isAccurate: boolean; // if lap was accurate representation (under a Safety Car)

  // pit timing
  pitInTime: number;
  pitOutTime: number;

  // in app data
  isChecked?: boolean;
  isLoaded?: boolean;
  active?: boolean;

  // Constructor - initialises LapData
  constructor(
    time: number,
    lapTime: number,
    lapNumber: number,
    sector1Time: number,
    sector2Time: number,
    sector3Time: number,
    compound: string,
    tyreLife: number,
    freshTyre: boolean,
    deleted: boolean,
    isAccurate: boolean,
    stint: number,
    position: number,
    minSpeed: number,
    maxSpeed: number,
    maxDrs: boolean,
    pitInTime: number,
    pitOutTime: number,
    throttle: number,
    isChecked?: boolean,
    isLoaded?: boolean,
  ) {
    this.time = time;
    this.lapTime = lapTime == -1 ? 9999 : lapTime; // changes invalid timing data to 9999
    this.lapNumber = lapNumber;
    this.sector1Time = sector1Time == -1 ? 9999 : sector1Time; // changes invalid timing data to 9999
    this.sector2Time = sector2Time == -1 ? 9999 : sector2Time; // changes invalid timing data to 9999
    this.sector3Time = sector3Time == -1 ? 9999 : sector3Time; // changes invalid timing data to 9999
    this.compound = compound;
    this.tyreLife = tyreLife;
    this.freshTyre = freshTyre;
    this.deleted = deleted;
    this.isAccurate = isAccurate;
    this.stint = stint;
    this.position = position;
    this.minSpeed = minSpeed;
    this.maxSpeed = maxSpeed;
    this.maxDrs = maxDrs;
    this.pitInTime = pitInTime;
    this.pitOutTime = pitOutTime;
    this.throttle = throttle;
    this.isChecked = isChecked == true;
    this.isLoaded = isLoaded == true;
  }

  // Convert from a list
  static fromList(list: any[]): LapData {
    return new LapData(
      list[0],
      list[1],
      list[2],
      list[3],
      list[4],
      list[5],
      list[6],
      list[7],
      list[8],
      list[9],
      list[10],
      list[11],
      list[12],
      list[13],
      list[14],
      list[15],
      list[16],
      list[17],
      list[18]
    );
  }

  // converts from json
  static fromJsonList(map: any[][]): Array<LapData> {
    let laps = [];
    for (let i = 0; i < map.length; i++) {
      laps.push(LapData.fromList(map[i]));
    }
    return laps;
  }

  // converts to string in console
  toString(): string {
    return `LapData(time: ${this.time}, lapTime: ${this.lapTime}, lapNumber: ${this.lapNumber}, sector1Time: ${this.sector1Time}, sector2Time: ${this.sector2Time}, sector3Time: ${this.sector3Time}, compound: ${this.compound}, tyreLife: ${this.tyreLife}, freshTyre: ${this.freshTyre}, deleted: ${this.deleted}, isAccurate: ${this.isAccurate}, stint: ${this.stint}, position: ${this.position}, isChecked@ ${this.isChecked})`;
  }
}