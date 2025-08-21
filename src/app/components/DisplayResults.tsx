import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Typography, Box, Skeleton, Button, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { PracticeResult, QualiResult, RaceResult } from '../utils/fetchResults';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import RemoveIcon from '@mui/icons-material/Remove';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useRouter } from 'next/navigation';

// formats race time to string
function formatRaceTime(result: RaceResult, maxLaps: number): string {
    if (result.position === 1) {
        const h = Math.floor(result.time / 3600);
        const m = Math.floor((result.time % 3600) / 60);
        const s = (result.time % 60).toFixed(3);
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(6, '0')}`;
    }
    const gap = maxLaps - result.lapsCompleted;
    if (gap === 0) return `+${result.time.toFixed(3)}`;
    return gap === 1 ? '+ 1 LAP' : `+ ${gap} LAPS`;
}

// formats to time in mins
function formatToMinSecMillis(seconds: number): string {
    if (seconds === -1) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    const millis = Math.round((seconds % 1) * 1000).toString().padStart(3, '0');
    return `${mins}:${secs}.${millis}`;
}

// displasy position cells
const PositionCell = ({ pos }: { pos: number }) => (
    <Typography
        fontWeight={pos <= 3 ? "bold" : "regular"}
        // colour based off of podium position
        color={pos <= 3 ? ["#ffc247", "#a8a8a8", "#CD7F32"][pos - 1] : "#EAEAEA"}
    >
        {pos}
    </Typography>
);

// displays fastest lap (with icon and colour)
const FastestLapCell = ({ time, fastest }: { time: number, fastest: number }) => (
    fastest === time && time !== -1 ? (
        <Box display="flex" alignItems="center" gap={0.5}>
            <AccessTimeIcon fontSize="small" sx={{ color: '#db34eb' }} />
            <Typography fontWeight="bold" color="#db34eb">
                {formatToMinSecMillis(time)}
            </Typography>
        </Box>
    ) : (
        <Typography>{time === -1 ? "" : formatToMinSecMillis(time)}</Typography>
    )
);

// wrapper for all results - displays the outer bit
const ResultsTableWrapper: React.FC<{
    year: string, round: string, session: string, availableSessions: string[], children: React.ReactNode
}> = ({ year, round, session, availableSessions, children }) => {
    const router = useRouter();
    return (
        <Box padding="20px" sx={{ width: '1300px', maxWidth: '100%' }}>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" gap={1} alignItems="center">
                        <Typography fontWeight="bold" fontSize={22} sx={{ m: 2 }}>
                            {year} {round.slice(3)} {session} Results
                        </Typography>
                        <Button
                            sx={{
                                height: 40, color: '#fff', backgroundColor: '#FFFFFF11', fontWeight: 'bold',
                                '&:hover': { backgroundColor: '#444' }, textTransform: 'none', px: 2, borderRadius: 1
                            }}
                            onClick={() => router.push(`/liveDash/${year}/${round.slice(4)}/${session}`)}
                        >
                            Replay
                        </Button>
                    </Box>
                    <FormControl size="small" sx={{ minWidth: 160, mr: 2, backgroundColor: '#FFFFFF11', borderRadius: 1 }}>
                        <InputLabel sx={{ color: '#ccc' }}>Jump to Session</InputLabel>
                        <Select
                            value=""
                            onChange={(e) => router.push(`/session/${year}/${round}/${e.target.value}`)}
                            displayEmpty
                        >
                            {availableSessions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
                {children}
            </TableContainer>
        </Box>
    );
};

// displays race results
export const RaceResultsTable: React.FC<{
    results: RaceResult[], year: string, round: string, session: string, availableSessions: string[]
}> = ({ results, year, round, session, availableSessions }) => {
    const maxLaps = Math.max(...results.map(r => r.lapsCompleted));
    const fastestLap = Math.min(...results.map(r => r.fastestLap === -1 ? Infinity : r.fastestLap));

    return (
        // table wrapper
        <ResultsTableWrapper {...{ year, round, session, availableSessions }}>

            {/* table */}
            <Table>
                <TableHead>
                    {/* displays column headings */}
                    <TableRow>
                        {["Pos", "Driver", "Team", "Time/Gap", "Fastest Lap", "Gained", "Points", "Laps"]
                            .map(h => <TableCell key={h}><Typography fontWeight="bold">{h}</Typography></TableCell>)}
                    </TableRow>
                </TableHead>
                {/* displays rows */}
                <TableBody>
                    {results.length === 0 ? Array.from({ length: 20 }).map((_, i) => (
                        <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) =>
                            <TableCell key={j}><Skeleton variant="rectangular" animation="wave" sx={{ height: 30, borderRadius: 1 }} /></TableCell>)}
                        </TableRow>
                    )) : results.map(r => {
                        const diff = r.gridPos - r.position;
                        return (
                            <TableRow key={r.position}>
                                <TableCell><PositionCell pos={r.position} /></TableCell>
                                <TableCell>{r.name}</TableCell>
                                <TableCell>{r.team}</TableCell>
                                <TableCell>{r.time > 0 ? formatRaceTime(r, maxLaps) : r.status}</TableCell>
                                <TableCell><FastestLapCell time={r.fastestLap} fastest={fastestLap} /></TableCell> { /* displays each driver's fastest lap */}
                                <TableCell>
                                    {diff > 0 ? <><ArrowDropUpIcon sx={{ color: 'green' }} />{diff}</> :
                                        diff < 0 ? <><ArrowDropDownIcon sx={{ color: 'red' }} />{Math.abs(diff)}</> :
                                            <RemoveIcon sx={{ color: 'gray' }} />}
                                </TableCell>
                                <TableCell>{r.points}</TableCell>
                                <TableCell>{r.lapsCompleted}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </ResultsTableWrapper>
    );
};

// displays quali results
export const QualiResultsTable: React.FC<{
    results: QualiResult[], year: string, round: string, session: string, availableSessions: string[]
}> = ({ results, year, round, session, availableSessions }) => {
    const [fastq1, fastq2, fastq3] = ["q1", "q2", "q3"].map(
        q => Math.min(...results.map(r => r[q as keyof QualiResult] === -1 ? Infinity : r[q as keyof QualiResult] as number))
    );

    return (
        // table wrapper
        <ResultsTableWrapper {...{ year, round, session, availableSessions }}>
            <Table>
                {/* displays column headings */}
                <TableHead>
                    <TableRow>{["Pos", "Driver", "Team", "Q1", "Q2", "Q3", "Laps"].map(h =>
                        <TableCell key={h}><Typography fontWeight="bold">{h}</Typography></TableCell>)}
                    </TableRow>
                </TableHead>
                {/* displays rows */}
                <TableBody>
                    {results.map(r => (
                        <TableRow key={r.position}>
                            <TableCell><PositionCell pos={r.position} /></TableCell>
                            <TableCell>{r.name}</TableCell>
                            <TableCell>{r.team}</TableCell>
                            {["q1", "q2", "q3"].map((q, i) => {
                                const val = r[q as keyof QualiResult] as number;
                                const fast = [fastq1, fastq2, fastq3][i];
                                return (
                                    <TableCell key={q}>
                                        {val === fast && val !== -1 ? <FastestLapCell time={val} fastest={fast} /> :
                                            val === -1 ? "" : `+${(val - fast).toFixed(3)}`}
                                    </TableCell>
                                );
                            })}
                            <TableCell>{r.laps}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ResultsTableWrapper>
    );
};

// displays practice results
export const PracticeResultsTable: React.FC<{
    results: PracticeResult[], year: string, round: string, session: string, availableSessions: string[]
}> = ({ results, year, round, session, availableSessions }) => {
    const fastest = Math.min(...results.map(r => r.fastestLap === -1 ? Infinity : r.fastestLap));

    return (
        <ResultsTableWrapper {...{ year, round, session, availableSessions }}>
            <Table>
                <TableHead>
                    {/* headings */}
                    <TableRow>{["Pos", "Driver", "Team", "Fastest Lap", "Laps"].map(h =>
                        <TableCell key={h}><Typography fontWeight="bold">{h}</Typography></TableCell>)}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {/* rows of data */}
                    {results.map(r => (
                        <TableRow key={r.position}>
                            <TableCell><PositionCell pos={r.position} /></TableCell>
                            <TableCell>{r.name}</TableCell>
                            <TableCell>{r.team}</TableCell>
                            <TableCell>
                                {r.fastestLap === fastest ? <FastestLapCell time={r.fastestLap} fastest={fastest} /> :
                                    r.fastestLap === -1 ? "" : `+${(r.fastestLap - fastest).toFixed(3)}`}
                            </TableCell>
                            <TableCell>{r.laps}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ResultsTableWrapper>
    );
};