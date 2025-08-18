export class DriverData {
  // Driver's info
  firstName: string;
  lastName: string;
  teamName: string;
  teamColour: string;

  // Driver's session info
  position: number;
  Q1: number;
  Q2: number;
  Q3: number;
  time: number;
  gridPosition: number;
  points: number;
  status: string;

  // Constructor - initialises DriverData
  constructor(
    firstName: string,
    lastName: string,
    teamName: string,
    teamColour: string,
    position: number,
    Q1: number,
    Q2: number,
    Q3: number,
    time: number,
    gridPosition: number,
    points: number,
    status: string,
  ) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.teamName = teamName;
    this.teamColour = teamColour;
    this.position = position;
    this.Q1 = Q1;
    this.Q2 = Q2;
    this.Q3 = Q3;
    this.time = time;
    this.gridPosition = gridPosition;
    this.points = points;
    this.status = status;
  }

  // helper to convert from list (from .json)
  static fromList(list: any[]): DriverData {
    return new DriverData(
      getFirstName(list[0]),
      list[1],
      getTeamName(list[2]),
      "#" + list[3],
      list[4],
      list[5],
      list[6],
      list[7],
      list[8],
      list[9],
      list[10],
      list[11]
    );
  }
}

// Maps teams and driver names to shorter versions - to fit on screen
const getTeamName = (name: string) => {
  let names: Record<string, string> = { "Red Bull Racing": "Red Bull", "Haas F1 Team": "Haas" };
  if (Object.keys(names).includes(name)) {
    return names[name];
  }
  else {
    return name;
  }
}
const getFirstName = (name: string) => {
  let names: Record<string, string> = { "Andrea Kimi": "Kimi" };
  if (Object.keys(names).includes(name)) {
    return names[name];
  }
  else {
    return name;
  }
}