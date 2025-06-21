import { Box, Button, ButtonBase, Card, CardContent, Skeleton, Typography } from '@mui/material';
import { DriverStanding, Standing } from '../utils/fetchStandings';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { motion } from 'framer-motion';
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface StandingCardProps {
    standing: Standing;
    position: number;
}

interface DriverStandingCardProps {
    standing: DriverStanding;
    position: number;
}

const StandingCard: React.FC<StandingCardProps> = ({ standing, position }) => {
    return (
        <Card variant="outlined" sx={{ mb: 2 }}>
            <Box flexDirection={"row"} display={"flex"} alignItems={"center"} height={"80px"} padding={"0px 20px"} justifyContent={"space-between"}>
                <Box display={"flex"} flexDirection={"row"} gap={4}>
                    <Typography fontWeight={"bold"} fontSize={22}>
                        {position}
                    </Typography>
                    <Typography fontWeight={"bold"} fontSize={22} color={"#" + standing.colour}>
                        {standing.name}
                    </Typography>
                </Box>
                <Box gap={4} flexDirection={"row"} display={"flex"} alignItems={"center"} >
                    <Box flexDirection={"row"} display={"flex"} gap={1} alignItems={"center"}>
                        <EmojiEventsIcon fontSize="small" htmlColor="#ffc247" />
                        <Typography fontSize={16} fontWeight={"bold"}>
                            {standing.wins}
                        </Typography>
                    </Box>
                    <Typography fontSize={19}>
                        {standing.points}pts{position == 1 ? "" : ` (+${standing.interval})`}
                    </Typography>
                </Box>
            </Box>
        </Card>
    );
};

const DriverStandingCard: React.FC<DriverStandingCardProps> = ({ standing, position }) => {
    return (
        <Card
            component={ButtonBase}
            onClick={() => console.log(`Clicked ${standing.name}`)}
            variant="outlined"
            sx={{
                width: "100%",
                textAlign: "left",
                borderRadius: 2,
                mb: 2,
                p: 0,
                overflow: "hidden",
                transition: "transform 0.2s ease, background-color 0.2s ease",
                "&:hover": {
                    backgroundColor: "#fff0",  // updated hover color
                    transform: "scale(1.02)",
                },
            }}
        >
            <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                height="100px"
                width={"100%"}
                px={2.5}
                justifyContent="space-between"
            >
                <Box display="flex" flexDirection="row" gap={4} alignItems="center">
                    <Typography fontWeight="bold" fontSize={22}>
                        {position}
                    </Typography>
                    <Box>
                        <Typography fontWeight="bold" fontSize={22}>
                            {standing.name}
                        </Typography>
                        <Typography fontSize={18} color={`#${standing.teamColour}`}>
                            {standing.team}
                        </Typography>
                    </Box>
                </Box>
                <Box display="flex" flexDirection="row" gap={4} alignItems="center">
                    <Box display="flex" flexDirection="row" gap={1} alignItems="center">
                        <EmojiEventsIcon fontSize="small" htmlColor="#ffc247" />
                        <Typography fontSize={16} fontWeight="bold">
                            {standing.wins}
                        </Typography>
                    </Box>
                    <Typography fontSize={19}>
                        {standing.points}pts{position === 1 ? "" : ` (+${standing.interval})`}
                    </Typography>
                </Box>
            </Box>
        </Card>
    );
};



interface StandingsListProps {
    standings: Standing[];
}

interface DriverStandingsListProps {
    standings: DriverStanding[];
}

const StandingsList: React.FC<StandingsListProps> = ({ standings }) => {
    if (standings.length == 0) {
        return (
            <>
                {
                    Array.from({ length: 10 }).map((_, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                maxHeight: 81,
                                width: '100%',
                            }}
                            mb={2}
                        >
                            <Skeleton
                                variant="rectangular"
                                animation="wave"
                                sx={{
                                    height: 81,
                                    width: '100%',
                                    borderRadius: 2,
                                }}
                            />
                        </Box>
                    ))
                }
            </>
        );
    }
    else {
        return (
            <>
                {standings.map((standing, index) => (
                    <StandingCard key={index} standing={standing} position={index + 1} />
                ))}
            </>
        );
    }
};

const DriverStandings: React.FC<DriverStandingsListProps> = ({ standings }) => {
    if (standings.length == 0) {
        return (
            <>
                {
                    Array.from({ length: 8 }).map((_, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                maxHeight: 100,
                                width: '100%',
                            }}
                            mb={2}
                        >
                            <Skeleton
                                variant="rectangular"
                                animation="wave"
                                sx={{
                                    height: 100,
                                    width: '100%',
                                    borderRadius: 2,
                                }}
                            />
                        </Box>
                    ))
                }
            </>
        );
    }
    else {
        return (
            <>
                {standings.map((standing, index) => (
                    <DriverStandingCard key={index} standing={standing} position={index + 1} />
                ))}
            </>
        );
    }
};


interface StandingsProps {
    standings: Standing[];
    width?: string;
}

interface DriverStandingsProps {
    standings: DriverStanding[];
    width?: string;
}

export function DisplayDriverStandings({ standings, width = '700px' }: DriverStandingsProps) {
    const router = useRouter();

    const [hovered, setHovered] = useState(false);

    const goToDrivers = () => {
        router.push(`dash?section=drivers`);
    };

    return (
        <Box padding="20px" sx={{ width, maxWidth: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography fontWeight="bold" fontSize={28}>
                    Driver Standings
                </Typography>

                {
                    width !== "700px" && (
                        <motion.button
                            onClick={goToDrivers}
                            onHoverStart={() => setHovered(true)}
                            onHoverEnd={() => setHovered(false)}
                            whileHover={{ scale: 1.04 }}          // ⬅️ 1.02× on hover
                            whileTap={{ scale: 0.96 }}            // keep the “press” effect
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            style={{ all: "unset", cursor: "pointer", display: "inline-block" }}
                        >
                            <Button
                                sx={{
                                    backgroundColor: "#222222",
                                    color: "#ffffff",
                                    fontWeight: 600,
                                    textTransform: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    border: "none",
                                    px: 2,
                                    py: 1,
                                    "&:hover": {
                                        backgroundColor: "#2c2c2c",
                                    },
                                }}
                            >
                                View&nbsp;Full&nbsp;Standings
                                <motion.span
                                    animate={{ scale: hovered ? 1.4 : 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                >
                                    <ArrowForwardIcon />
                                </motion.span>
                            </Button>
                        </motion.button>
                    )
                }
            </Box>

            <DriverStandings standings={standings} />
        </Box>
    );
}


export function DisplayConstructorStandings(
    { standings, width = "700px" }: StandingsProps
) {
    const [hovered, setHovered] = useState(false);
    const router = useRouter();

    const goToDrivers = () => {
        router.push(`dash?section=constructors`);
    };

    return (
        <Box padding="20px" sx={{ width, maxWidth: "100%" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography fontWeight="bold" fontSize={28}>
                    Constructor Standings
                </Typography>

                {
                    width !== "700px" && (
                        <motion.button
                            onClick={goToDrivers}
                            onHoverStart={() => setHovered(true)}
                            onHoverEnd={() => setHovered(false)}
                            whileHover={{ scale: 1.04 }}          // ⬅️ 1.02× on hover
                            whileTap={{ scale: 0.96 }}            // keep the “press” effect
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            style={{ all: "unset", cursor: "pointer", display: "inline-block" }}
                        >
                            <Button
                                sx={{
                                    backgroundColor: "#222222",
                                    color: "#ffffff",
                                    fontWeight: 600,
                                    textTransform: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    border: "none",
                                    px: 2,
                                    py: 1,
                                    "&:hover": {
                                        backgroundColor: "#2c2c2c",
                                    },
                                }}
                            >
                                View&nbsp;Full&nbsp;Standings
                                <motion.span
                                    animate={{ scale: hovered ? 1.4 : 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                >
                                    <ArrowForwardIcon />
                                </motion.span>
                            </Button>
                        </motion.button>
                    )
                }

            </Box>

            <StandingsList standings={standings} />
        </Box>
    );
}