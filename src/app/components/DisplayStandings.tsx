import { Box, Card, Skeleton, Typography, Button } from "@mui/material";
import { DriverStanding, ConstructorStanding } from "../utils/fetchStandings";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";


interface BaseCardProps {
    position: number;
    name: string;
    subtitle?: string;
    colour?: string;
    wins: number;
    points: number;
    interval?: string | number;
}

const BaseCard: React.FC<BaseCardProps> = ({
    position,
    name,
    subtitle,
    colour,
    wins,
    points,
    interval,
}) => (
    <Card variant="outlined" sx={{ mb: 2, width: "100%" }}>
        <Box
            flexDirection="row"
            display="flex"
            alignItems="center"
            height={subtitle ? "100px" : "80px"}
            px={2.5}
            justifyContent="space-between"
        >
            <Box display="flex" flexDirection="row" gap={4} alignItems="center">
                <Typography fontWeight="bold" fontSize={22}>
                    {position}
                </Typography>
                <Box>
                    {
                        subtitle ? <Typography fontWeight="bold" fontSize={22} >
                            {name}
                        </Typography>
                            :
                            <Typography fontWeight="bold" fontSize={22} color={`#${colour}`}>
                                {name}
                            </Typography>
                    }
                    {subtitle && (
                        <Typography fontSize={18} color={`#${colour}`}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Box display="flex" flexDirection="row" gap={4} alignItems="center">
                <Box display="flex" flexDirection="row" gap={1} alignItems="center">
                    <EmojiEventsIcon fontSize="small" htmlColor="#ffc247" />
                    <Typography fontSize={16} fontWeight="bold">
                        {wins}
                    </Typography>
                </Box>
                <Typography fontSize={19}>
                    {points}pts{position === 1 ? "" : ` (+${interval})`}
                </Typography>
            </Box>
        </Box>
    </Card>
);

// Specific Cards
export const ConstructorStandingCard: React.FC<{
    standing: ConstructorStanding;
    position: number;
}> = ({ standing, position }) => (
    <BaseCard
        position={position}
        name={standing.name}
        colour={standing.colour}
        wins={standing.wins}
        points={standing.points}
        interval={standing.interval}
    />
);

export const DriverStandingCard: React.FC<{
    standing: DriverStanding;
    position: number;
}> = ({ standing, position }) => (
    <BaseCard
        position={position}
        name={standing.name}
        subtitle={standing.team}
        colour={standing.teamColour}
        wins={standing.wins}
        points={standing.points}
        interval={standing.interval}
    />
);

// Shared List Component
interface StandingsListBaseProps<T> {
    standings: T[];
    renderCard: (standing: T, index: number) => React.ReactNode;
    skeletonHeight: number;
    skeletonCount: number;
}

const StandingsListBase = <T,>({
    standings,
    renderCard,
    skeletonHeight,
    skeletonCount,
}: StandingsListBaseProps<T>) => {
    if (standings.length === 0) {
        return (
            <>
                {Array.from({ length: skeletonCount }).map((_, i) => (
                    <Skeleton
                        key={i}
                        variant="rectangular"
                        animation="wave"
                        sx={{ height: skeletonHeight, width: "100%", borderRadius: 2, mb: 2 }}
                    />
                ))}
            </>
        );
    }

    return <>{standings.map((s, i) => renderCard(s, i))}</>;
};

export const ConstructorStandingsList: React.FC<{
    standings: ConstructorStanding[];
}> = ({ standings }) => (
    <StandingsListBase
        standings={standings}
        renderCard={(s, i) => (
            <ConstructorStandingCard standing={s} position={i + 1} key={i} />
        )}
        skeletonHeight={81}
        skeletonCount={10}
    />
);

export const DriverStandingsList: React.FC<{ standings: DriverStanding[] }> = ({
    standings,
}) => (
    <StandingsListBase
        standings={standings}
        renderCard={(s, i) => (
            <DriverStandingCard standing={s} position={i + 1} key={i} />
        )}
        skeletonHeight={100}
        skeletonCount={8}
    />
);

// Display Wrappers with Title + "View Full Standings"
const DisplayWrapper: React.FC<{
    title: string;
    width: string;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ title, width, onClick, children }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <Box padding="20px" sx={{ width, maxWidth: "100%" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography fontWeight="bold" fontSize={28}>
                    {title}
                </Typography>

                {width !== "700px" && (
                    <motion.button
                        onClick={onClick}
                        onHoverStart={() => setHovered(true)}
                        onHoverEnd={() => setHovered(false)}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        style={{ all: "unset", cursor: "pointer" }}
                    >
                        <Button
                            sx={{
                                backgroundColor: "#222",
                                color: "#fff",
                                fontWeight: 600,
                                textTransform: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                px: 2,
                                py: 1,
                                "&:hover": { backgroundColor: "#2c2c2c" },
                            }}
                        >
                            View Full Standings
                            <motion.span
                                animate={{ scale: hovered ? 1.4 : 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                            >
                                <ArrowForwardIcon />
                            </motion.span>
                        </Button>
                    </motion.button>
                )}
            </Box>
            {children}
        </Box>
    );
};

export function DisplayDriverStandings({
    standings,
    width = "700px",
}: {
    standings: DriverStanding[];
    width?: string;
}) {
    const router = useRouter();
    return (
        <DisplayWrapper
            title="Driver Standings"
            width={width}
            onClick={() => router.push("dash?section=drivers")}
        >
            <DriverStandingsList standings={standings} />
        </DisplayWrapper>
    );
}

export function DisplayConstructorStandings({
    standings,
    width = "700px",
}: {
    standings: ConstructorStanding[];
    width?: string;
}) {
    const router = useRouter();
    return (
        <DisplayWrapper
            title="Constructor Standings"
            width={width}
            onClick={() => router.push("dash?section=constructors")}
        >
            <ConstructorStandingsList standings={standings} />
        </DisplayWrapper>
    );
}
