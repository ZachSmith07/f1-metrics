export class DriverData {
  firstName: string;
  lastName: string;
  teamName: string;
  teamColour: string;
  gridPosition: number;

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

  static fromList(list: [string, string, string, string, number]): DriverData {
    return new DriverData(
      DriverData.formatFirstName(list[0]),
      list[1],
      DriverData.formatTeamName(list[2]),
      "#" + list[3],
      list[4]
    );
  }

  private static formatTeamName(name: string): string {
    const names: Record<string, string> = {
      "Red Bull Racing": "Red Bull",
      "Haas F1 Team": "Haas"
    };
    return names[name] ?? name;
  }

  private static formatFirstName(name: string): string {
    const names: Record<string, string> = {
      "Andrea Kimi": "Kimi"
    };
    return names[name] ?? name;
  }
}