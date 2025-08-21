export class TelemetryFrame {
  // car data
  speed: number;
  gear: number;
  throttle: number;
  brake: number;
  drs: number;
  time: number;

  // position data
  x: number;
  y: number;

  // self-calculated info
  relativeDistance: number;
  deltaTime: number;

  // Constructor - generate TelemetryFrame
  constructor(
    speed: number,
    gear: number,
    throttle: number,
    brake: boolean,
    drs: boolean,
    x: number,
    y: number,
    time: number,
    relativeDistance: number,
    deltaTime: number
  ) {
    this.speed = speed;
    this.gear = gear;
    this.throttle = throttle;
    this.brake = brake ? 1 : 0;
    this.drs = drs ? 1 : 0;
    this.x = x;
    this.y = y;
    this.time = time;
    this.relativeDistance = relativeDistance;
    this.deltaTime = deltaTime;
  }

  // generates an entire lap's telemetry
  static fromList(list: any[][]): TelemetryFrame[] {
    let telems = [];
    for (let i = 0; i < list[0].length; i++) {
      telems.push(new TelemetryFrame(list[0][i], list[1][i], list[2][i], list[3][i], list[4][i], list[5][i], list[6][i], list[7][i], list[8][i], 0.01));
    }
    return telems;
  }

  // converts to string in console
  toString(): string {
    return `TelemetryFrame(speed: ${this.speed}, gear: ${this.gear}, throttle: ${this.throttle}, brake: ${this.brake}, drs: ${this.drs}, x: ${this.x}, y: ${this.y}, time: ${this.time}, relativeDistance: ${this.relativeDistance})`;
  }
}