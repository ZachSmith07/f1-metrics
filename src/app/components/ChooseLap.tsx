import React, { useEffect, useRef, useState } from "react";
import { LapData } from "../classes/lapData";
import { DriverData } from "../classes/driverData";
import { Box, Button, Checkbox, Tab, Tabs } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { formatLapTime } from "../utils/formatting";

// inputs to choose laps
type ChooseLapsProps = {
  laps: LapData[][];
  driversData: DriverData[];
  onChoose: (lap?: LapData, driver?: DriverData) => void;
  isCheckbox: boolean; // whether is chosen by checkbox or by button
};

// interface for users to choose and select laps
const ChooseLaps: React.FC<ChooseLapsProps> = ({ laps, driversData, onChoose, isCheckbox }) => {
  const [driversDisplay, setDriversDisplay] = useState<string[]>(["Loading..."]);
  const [currentDriverIndex, setDriverIndex] = useState<number>(0);
  const [lapsData, setLapsData] = useState<LapData[][]>(laps);
  const [gridKey, setGridKey] = useState(0);

  const [driverChosenVal, setDriverChosen] = useState<string>("Loading...");
  const [lastChangeIndex, setLastChangeIndex] = useState(-1);

  // handles shift being pressed (for multi-select)
  const shiftPressed = useRef(false);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Shift") shiftPressed.current = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") shiftPressed.current = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);


  // calls onChoose() when a checkbox is checked
  useEffect(() => {
    if (isCheckbox) {
      onChoose();
    }
  }, [lapsData]);


  // creates the list of driver tabs
  useEffect(() => {
    const fetchLaps = async () => {
      try {
        let driverData = driversData;

        // checks if the positions are calculated
        let calculatePositions = true;
        for (let i = 0; i < driverData.length; i++) {
          if (driverData[i].position != -1) {
            calculatePositions = false;
          }
        }


        let driverPositionsEach = [];

        // calculates positions if not available already
        if (calculatePositions) {
          let minLapTime = [];
          for (let i = 0; i < lapsData.length; i++) {
            let currentMinLap = 999;
            for (let j = 0; j < lapsData[i].length; j++) {
              let lap = lapsData[i][j];
              if (!lap.deleted && lap.lapTime != -1) {
                if (lap.lapTime < currentMinLap) {
                  currentMinLap = lap.lapTime;
                }
              }
            }
            minLapTime.push([currentMinLap, i]);
          }

          minLapTime.sort((a, b) => a[0] - b[0]);

          console.log(minLapTime);

          for (let i = 0; i < minLapTime.length; i++) {
            driverData[minLapTime[i][1]].position = i + 1;
            driverPositionsEach.push(minLapTime[i][1]);
          }
        }
        else {
          // index = race position, value = driver index
          for (let i = 0; i < driverData.length; i++) {
            driverPositionsEach.push(-1);
          }
          for (let i = 0; i < driverData.length; i++) {
            driverPositionsEach[driverData[i].position - 1] = i;
          }
        }

        // creating the tabs (e.g. "1) George Russell")
        let driversDesc = [];
        for (let i = 0; i < driverPositionsEach.length; i++) {
          driversDesc.push(`${i + 1}) ${driverData[i].firstName} ${driverData[i].lastName}`);
        }

        // sets the current chosen driver (index 0)
        if (driverPositionsEach.length > 0) {
          setDriverChosen(`1) ${driverData[driverPositionsEach[0]].firstName} ${driverData[driverPositionsEach[0]].lastName}`);
        }

        // sets driver tabs
        setDriversDisplay(driversDesc);
      } catch (error) {
        console.error("Error fetching pit performance data:", error);
      }
    };

    fetchLaps();
  }, []);

  // changes driver
  const handleDriverChange = (event: React.SyntheticEvent, value: any) => {
    setDriverIndex(driversDisplay.indexOf(value));
    // changes the key to trigger re-render
    setGridKey(gridKey + 1);
    setLastChangeIndex(-1);
    if (value !== null) setDriverChosen(value);
  };

  // when header is clicked (to trigger sort usually)
  const handleHeaderClick = (field: string) => {
    // handles isChecked
    if (field === 'isChecked') {
      // selects laps
      const newLapsData = [...lapsData[currentDriverIndex]];
      const isChecked = newLapsData.map((x) => x.isChecked);
      if (isChecked.includes(true)) { // if one or more is selected
        if (isChecked.includes(false)) { // if only some are selected
          // select all laps
          for (let i = 0; i < newLapsData.length; i++) {
            newLapsData[i].isChecked = true;
          }
        }
        else { // if all are selected
          // deselect all laps
          for (let i = 0; i < newLapsData.length; i++) {
            newLapsData[i].isChecked = false;
          }
        }
      }
      else { // if none are selected
        // selects fast laps
        for (let i = 0; i < newLapsData.length; i++) {
          if (newLapsData[i].isAccurate) {
            newLapsData[i].isChecked = true;
          }
        }
      }
      let finishedLap = [...lapsData];
      finishedLap[currentDriverIndex] = newLapsData;
      setLapsData(finishedLap);
    }
  };

  // defines the column headers and how to render/format them
  const columns: GridColDef[] = [
    {
      field: 'lapNumber', // defines what row.${field} it is - so here it would be row.lapNumber
      headerName: 'Lap Number',
      width: 130,
      disableColumnMenu: true,
    },
    {
      field: 'lapTime',
      headerName: 'Lap Time',
      width: 110,
      disableColumnMenu: true,
      valueFormatter: (params: number) => params == 9999 ? "nan" : formatLapTime(params), // formats lap time
    },
    {
      field: 'sector1Time',
      headerName: 'Sector 1',
      width: 102,
      disableColumnMenu: true,
      valueFormatter: (params: number) => params == 9999 ? "nan" : params.toFixed(3).padStart(6, '0'), // formats trailing zeroes (e.g. 27.820)
    },
    {
      field: 'sector2Time',
      headerName: 'Sector 2',
      width: 102,
      disableColumnMenu: true,
      valueFormatter: (params: number) => params == 9999 ? "nan" : params.toFixed(3).padStart(6, '0'), // trailing zeroes
    },
    {
      field: 'sector3Time',
      headerName: 'Sector 3',
      width: 102,
      disableColumnMenu: true,
      valueFormatter: (params: number) => params == 9999 ? "nan" : params.toFixed(3).padStart(6, '0'), // trailing zeroes
    },
    {
      field: 'compound',
      headerName: 'Compound',
      width: 120,
      disableColumnMenu: true,
    },
    {
      field: 'tyreLife',
      headerName: 'Tyre Age',
      width: 105,
      disableColumnMenu: true,
    },
    {
      field: 'isAccurate',
      headerName: 'Accurate',
      width: 110,
      disableColumnMenu: true,
      renderCell: (params) => {
        const isAccurate = params.row.isAccurate;
        return ( // checkmark if accurate, otherwise a cross
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            {isAccurate ? (
              <CheckIcon style={{ color: 'green' }} />
            ) : (
              <CloseIcon style={{ color: 'red' }} />
            )}
          </div>
        );
      },
    },
    isCheckbox ? { // if is checkbox displays a checkbox
      field: 'isChecked',
      headerName: 'Selected',
      width: 75,
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const row = params.row as LapData;
        return ( // displays checkbox
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Checkbox
              checked={row.isChecked}
              onChange={(event) => {
                const newLapsData = [...lapsData];
                newLapsData[currentDriverIndex][row.lapNumber - 1].isChecked = event.target.checked; // sets current to true

                if (shiftPressed.current && lastChangeIndex != -1) {
                  // when shift is pressed - selects all between last index and now
                  if (lastChangeIndex > row.lapNumber - 1) {
                    for (let i = row.lapNumber - 1; i < lastChangeIndex; i++) {
                      console.log(i);
                      newLapsData[currentDriverIndex][i].isChecked = true;
                    }
                  }
                  else {
                    for (let i = lastChangeIndex; i < row.lapNumber; i++) {
                      console.log(i);
                      newLapsData[currentDriverIndex][i].isChecked = true;
                    }
                  }
                }

                setLapsData(newLapsData);
                setLastChangeIndex(row.lapNumber - 1);
              }}
            >
            </Checkbox>
          </div>
        );
      },
    }
      :
      { // otherwise show a choose lap button (if selected show "DESELECT")
        field: 'isChecked',
        headerName: 'Load',
        width: 75,
        disableColumnMenu: true,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const row = params.row as LapData;
          return (
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Button
                style={
                  {
                    color: row.isLoaded == true ? "#00FF00" : ""
                  }
                }
                onClick={() => {
                  const newLapsData = [...lapsData];
                  newLapsData[currentDriverIndex][row.lapNumber - 1].isLoaded = !newLapsData[currentDriverIndex][row.lapNumber - 1].isLoaded;

                  onChoose(laps[currentDriverIndex][row.lapNumber - 1], driversData[currentDriverIndex]); // on lap selected (load telemetry usually)

                  setLapsData(newLapsData);
                }}
              >
                {row.isLoaded == true ? "Deselect" : "Load Lap"}
              </Button>
            </div>
          );
        },
      },
  ];


  // displays the lap grid table
  return (
    <Box>
      {/* tabs containing driver names */}
      <Tabs
        value={driverChosenVal}
        onChange={handleDriverChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        {driversDisplay.map((driver) => (
          <Tab key={driver} label={driver} value={driver} />
        ))}
      </Tabs>
      {/* grid showing the driver's laps */}
      <DataGrid
        key={gridKey}
        rows={lapsData[currentDriverIndex].map((row, index) => ({ ...row, id: index }))}
        columns={columns}
        disableRowSelectionOnClick
        onColumnHeaderClick={(params) => handleHeaderClick(params.field)}
        rowHeight={40}
      />
    </Box>
  );
};

export default ChooseLaps;