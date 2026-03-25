export class DriverData {
  // Driver's info
  firstName: string;
  lastName: string;
  teamName: string;
  teamColour: string;
  gridPosition: number;

  // Constructor - initialises DriverData
  constructor(
    firstName: string,
    lastName: string,
    teamName: string,
    teamColour: string,
    gridPosition: number,
  ) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.teamName = teamName;
    this.teamColour = teamColour;
    this.gridPosition = gridPosition;
  }

  // helper to convert from list (from .json)
  static fromList(list: any[]): DriverData {
    return new DriverData(
      getFirstName(list[0]),
      list[1],
      getTeamName(list[2]),
      "#" + list[3],
      list[4]
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