"use client";
import { Box, Button, Card, CardActionArea, Divider, IconButton, Skeleton, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import { motion } from "framer-motion";
import { EmptyEvent, ResultsEvent } from "../utils/fetchYearData";

type EventLike = EmptyEvent | ResultsEvent;
type EventListProps = { events: EventLike[] };
type EventCardProps = { event: EventLike; eventNum: number; variant: "full" | "basic" };

// displays flag from country code/name
const Flag = ({ code, size = 24 }: { code: string; size?: number }) => (
  <img src={`flags/${code}.svg`} alt={`${code} flag`} style={{ height: size, borderRadius: 4 }} />
);

// formats and displays date as <3 letter month> <day of month>
const DateText = ({ date }: { date: string }) => (
  <Typography fontSize={20} ml={1} fontWeight={400}>
    {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
  </Typography>
);

// groups sessions by day and displays them (e.g. Friday - Practice 1 (18:00), Practice 2 (20:30))
type SessionTuple = [string, string, boolean?];

export const SessionsByDay = ({
  sessions,
  variant = "full",
  event,
  eventNum
}: {
  sessions: SessionTuple[];
  variant: "full" | "basic";
  event: EventLike;
  eventNum: number;
}) => {
  const router = useRouter();

  const groups = useMemo(() => {
    const byDay: Record<string, [string, string, boolean][]> = {};

    sessions.forEach(([name, dt, bool]) => {
      const d = new Date(dt);
      const key = d.toDateString();
      (byDay[key] ??= []).push([
        name,
        d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        Boolean(bool),
      ]);
    });

    return Object.entries(byDay).map(([k, items]) => ({
      label: new Date(k).toLocaleDateString("en-US", { weekday: "long" }),
      items,
    }));
  }, [sessions]);

  return (
    <>
      {groups.map(({ label, items }, i) => (
        <Box key={i} display="flex" alignItems="center" gap={1} mt={0.5}>
          <Typography fontSize={20} fontWeight="bold">
            {label} -
          </Typography>

          <Box display="flex" alignItems="center" fontSize={18}>
            {items.map(([name, time, flag], idx) => {
              const content = `${name} (${time})`;

              if (variant === "basic" && flag) {
                return (
                  <Button
                    key={idx}
                    variant="text"
                    size="small"
                    sx={{
                      minWidth: "auto",
                      p: 0,
                      pl: 0.6,
                      pr: 0.6,
                      fontSize: "inherit",
                      fontWeight: "inherit",
                      color: "inherit",
                      textTransform: "none",
                    }}
                    onClick={() => {
                      router.push(
                        `/session/${event.date.slice(0, 4)}/${String(eventNum).padStart(2, "0")})%20${encodeURIComponent(event.event)}/${encodeURIComponent(name)}`
                      );
                    }}
                  >
                    {content}
                  </Button>
                );
              }

              return <span key={idx} >{content}</span>;
            }).reduce<React.ReactNode[]>((prev, curr, idx) => (
              idx === 0
                ? [curr]
                : [
                  ...prev,
                  <span key={`comma-${idx}`} style={{ paddingRight: 4 }}>,</span>,
                  curr
                ]
            ), [])
            }
          </Box>


        </Box>
      ))}
    </>
  );
};

// live countdown for the next session (returns days, hours, minutes and seconds)
const useCountdown = (event?: EmptyEvent) => {
  const [state, setState] = useState({ label: "", d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (!event) return;
    const tick = () => {
      const now = new Date();
      const next = event.sessions.find(([, date]) => new Date(date).getTime() > now.getTime());
      if (!next) return setState(s => (s.label ? { label: "", d: 0, h: 0, m: 0, s: 0 } : s));
      const [label, when] = next;
      const diff = new Date(when).getTime() - now.getTime();
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setState({ label, d, h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [event]);

  return state;
};

// displays the countdown
const Countdown = ({ label, d, h, m, s }: { label: string; d: number; h: number; m: number; s: number }) => {
  if (!(d || h || m || s)) return null;
  const Cell = ({ v, t }: { v: number; t: string }) => (
    <Box display="flex" flexDirection="column" width={75} alignItems="center" justifyContent="center" p={1}>
      <Typography fontSize={16} fontWeight={"bold"}>{v}</Typography>
      <Typography fontSize={16} fontWeight={"bold"}>{t}</Typography>
    </Box>
  );
  return (
    <Box mr="8px" sx={{ bgcolor: "#555", borderRadius: 2, p: 1.5, color: "white", display: "flex", flexDirection: "column", alignItems: "center", height: 120 }}>
      <Typography fontSize={20} textAlign="center" fontWeight={"bold"}>Countdown to {label}</Typography> {/* displays the countdown to the session */}
      {/* displays countdown in days hours mins and seconds (depending on if more than a day away) */}
      <Box display="flex" justifyContent="space-between" width="100%" mt={1}>
        {d > 0 && <Cell v={d} t="DAYS" />}
        <Cell v={h} t="HOURS" />
        <Cell v={m} t="MINS" />
        {d === 0 && <Cell v={s} t="SECS" />}
      </Box>
    </Box>
  );
};

// title with grand prix name, flag image, and date of next/last session
const Header = ({ prefix, name, country, date }: { prefix?: string; name: string; country: string; date: string }) => (
  <Box display="flex" alignItems="center" gap={1.5}>
    <Typography fontSize={22} fontWeight={"bold"}>{prefix ? `${prefix} - ${name}` : name}</Typography>
    <Flag code={country} />
    <DateText date={date} />
  </Box>
);

// displays event when clicked on (allows user to click on any event and it sends them to that page)
const OpenEvent = ({ event, eventNum, onClose }: { event: EmptyEvent | ResultsEvent; eventNum: number; onClose: () => void }) => {
  const router = useRouter();
  return (
    <Card>
      <Box p="7px 7px 7px 10px">
        <Box display="flex" flexDirection="column">
          <Box display="flex" justifyContent="space-between" alignItems="start" width="100%">
            <Header prefix={`R${eventNum}`} name={event.event} country={event.country} date={event.date} />
            <IconButton onClick={onClose}><CloseIcon /></IconButton> { /* can close this event */}
          </Box>
          <Box display="flex" justifyContent="space-between" width="100%" p={2}>
            {event.sessions.map(([sessionName, , enabled = true], i) => (
              <Button
                key={i}
                variant="contained"
                disabled={!enabled}
                sx={{ height: 50, bgcolor: "#DDD" }}
                onClick={() =>
                  // pushes to event analysis
                  router.push(
                    `/session/${event.date.slice(0, 4)}/${String(eventNum).padStart(2, "0")})%20${encodeURIComponent(event.event)}/${encodeURIComponent(String(sessionName))}`
                  )
                }
              >
                {sessionName}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

// displays card with future event
const FullUpcomingCard = ({ event, eventNum }: { event: EmptyEvent; eventNum: number }) => {
  const [open, setOpen] = useState(false);
  const c = useCountdown(event);
  // displays open event if has been clicked on
  if (open) return <OpenEvent event={event} eventNum={eventNum} onClose={() => setOpen(false)} />;
  // else returns list of sessions and countdown
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} style={{ display: "inline-block" }}>
      <Card>
        <CardActionArea onClick={() => { setOpen(true); console.log("OPENED") }}>
          <Box p="7px 7px 7px 10px">
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" flexDirection="column" gap={0}>
                <Header prefix={`R${eventNum}`} name={event.event} country={event.country} date={event.date} />
                <SessionsByDay sessions={event.sessions} variant="full" event={event} eventNum={eventNum} />
              </Box>
              <Countdown label={c.label} d={c.d} h={c.h} m={c.m} s={c.s} />
            </Box>
          </Box>
        </CardActionArea>
      </Card>
    </motion.div>
  );
};


// displays past event (with results)
const FullResultsCard = ({ event, eventNum }: { event: ResultsEvent; eventNum: number }) => {
  const [open, setOpen] = useState(false);
  // if open displays the same open event
  if (open) return <OpenEvent event={event} eventNum={eventNum} onClose={() => setOpen(false)} />;
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} style={{ display: "inline-block" }}>
      <Card>
        <CardActionArea onClick={() => setOpen(true)}>
          <Box p="7px 7px 7px 10px">
            <Box display="flex" flexDirection="column">

              {/* displays the top row */}
              <Box display="flex" justifyContent="space-between" width="100%">
                <Header prefix={`R${eventNum}`} name={event.event} country={event.country} date={event.date} />
                <Box width={208}><Typography fontSize={22} fontWeight={"bold"}>Race Results</Typography></Box>
              </Box>

              <Box display="flex" justifyContent="space-between" width="100%">

                {/* left column */}
                <Box display="flex" gap={3}>
                  <Box display="flex" flexDirection="column" width="375px">
                    <Box display="flex" gap={0.7} alignItems="center">
                      <Typography fontSize={20} fontWeight={"bold"} color="#db34eb">Fastest Lap</Typography>
                      <AccessTimeIcon fontSize="small" sx={{ color: "#db34eb", mt: 0.2 }} />
                      <Typography fontSize={20} fontWeight={"bold"} color="#db34eb">-</Typography>
                      <Typography fontSize={18} fontWeight={400}>{event.fl}</Typography>
                    </Box>
                    <Box display="flex" gap={0.7} alignItems="center">
                      <Typography fontSize={20} fontWeight={"bold"} color="gold">Championship Leader</Typography>
                      <EmojiEventsIcon fontSize="small" sx={{ color: "gold", mt: 0.2 }} />
                      <Typography fontSize={20} fontWeight={"bold"} color="gold">-</Typography>
                      <Typography fontSize={18} fontWeight={400}>{event.championshipLeader?.[0]} ({event.championshipLeader?.[1]}pts)</Typography>
                    </Box>
                    <Box display="flex" gap={0.7} alignItems="center">
                      <Typography fontSize={20} fontWeight={"bold"} color="silver">Most Points</Typography>
                      <EmojiEventsIcon fontSize="small" sx={{ color: "silver", mt: 0.2 }} />
                      <Typography fontSize={20} fontWeight={"bold"} color="silver">-</Typography>
                      <Typography fontSize={18} fontWeight={400}>{event.topDriver?.[0]} ({event.topDriver?.[1]}pts)</Typography>
                    </Box>
                  </Box>

                  <Divider orientation="vertical" sx={{ height: 60, borderRightWidth: 2, borderColor: "#CCC", my: 2, mx: 2 }} />

                  {/* teams ranking */}
                  <Box display="flex" flexDirection="column" width={175}>
                    {[0, 1, 2].map(i => (
                      <Box key={i} display="flex" gap={1} alignItems="center">
                        <Typography fontSize={20} fontWeight={"bold"} color={["gold", "silver", "#CE8946"][i]}>{i + 1} -</Typography>
                        <Typography fontSize={18} fontWeight={400}>{event.topTeams?.[i][0]} ({event.topTeams?.[i][1]})</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* driver podium */}
                <Box display="flex" flexDirection="column" width={220}>
                  {event.top3.map((name, i) => (
                    <Box key={i} display="flex" gap={1} alignItems="center">
                      <Typography fontSize={20} fontWeight={"bold"} color={["gold", "silver", "#CE8946"][i]}>
                        {["🥇", "🥈", "🥉"][i]} -
                      </Typography>
                      <Typography fontSize={18} fontWeight={400}>{name}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </CardActionArea>
      </Card>
    </motion.div>
  );
};

// small card shown on home screen
const BasicCard = ({ event, eventNum }: { event: EventLike; eventNum: number }) => {
  const router = useRouter();

  // if event not happened
  if (event instanceof EmptyEvent) {
    return (
      <Card variant="outlined">
        <Box p="7px 7px 7px 10px">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" flexDirection="column">
              <Header name={event.event} country={event.country} date={event.date} />
              <SessionsByDay sessions={event.sessions} variant="basic" event={event} eventNum={eventNum} />
            </Box>
          </Box>
        </Box>
      </Card>
    );
  }

  // if event has the results
  return (
    <Card
      variant="outlined"
      style={{ transition: "transform .2s ease-in-out" }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.transform = "scale(1.02)")}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
    >
      <CardActionArea
        onClick={() =>
          // goes to the event analysis page
          router.push(
            `/session/${event.date.slice(0, 4)}/${String(eventNum).padStart(2, "0")})%20${encodeURIComponent(event.event)}/Race`
          )
        }
      >
        <Box p="10px 15px 10px 12px">
          <Box display="flex" flexDirection="column">
            <Box display="flex" justifyContent="space-between" width="100%">
              <Box display="flex" gap={1.5} alignItems="center">
                <Typography fontSize={22} fontWeight={"bold"}>{event.event}</Typography>
                <Flag code={event.country} />
              </Box>
              <DateText date={event.date} />
            </Box>
            {/* displays podium in a row */}
            <Box display="flex" justifyContent="space-between" mt={1}>
              <Typography fontSize={18} fontWeight={400}>🥇 {event.top3[0]}</Typography>
              <Typography fontSize={18} fontWeight={400}>🥈 {event.top3[1]}</Typography>
              <Typography fontSize={18} fontWeight={400}>🥉 {event.top3[2]}</Typography>
            </Box>
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
};

// displays different cards based on the variant and whether it has occured yet
const EventCard = ({ event, eventNum, variant }: EventCardProps) => {
  if (variant === "basic") return <BasicCard event={event} eventNum={eventNum} />;
  if (event instanceof EmptyEvent) return <FullUpcomingCard event={event} eventNum={eventNum} />;
  return <FullResultsCard event={event} eventNum={eventNum} />;
};

// displays a bunch of "skeletons" (grey background to represent the cards)
const SkeletonList = ({ count, tallFirst = false }: { count: number; tallFirst?: boolean }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2, maxHeight: tallFirst && i === 0 ? 148 : 150, width: "100%" }}>
        <Skeleton variant="rectangular" animation="wave" sx={{ height: tallFirst && i === 0 ? 148 : 150, width: "100%", borderRadius: 2 }} />
      </Box>
    ))}
  </>
);

// displays all events
const EventList = ({ events, variant }: { events: EventLike[]; variant: "full" | "basic" }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
    {events.length === 0 ? (
      <SkeletonList count={variant === "basic" ? 8 : 20} tallFirst={variant === "basic"} />
    ) : (
      events.map(
        (e, i) => e.round !== 0 && <EventCard key={`${e.date}-${i}`} event={e} eventNum={e.round} variant={variant} />
      )
    )}
  </div>
);

// displays eventsw with bounding
export function DisplayEvents({ events }: EventListProps) {
  return (
    <Box p="20px" sx={{ width: "900px", maxWidth: "100%" }}>
      <EventList events={events} variant="full" />
    </Box>
  );
}

// displays events section of the home page
export function DisplayEventsBasic({ events }: EventListProps) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  return (
    <Box p="20px" sx={{ width: "500px", maxWidth: "100%" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography fontSize={28} fontWeight={"bold"}>Past Events</Typography>

        {/* button to view every event */}
        <motion.button
          onClick={() => router.push("dash?section=events")}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{ all: "unset", cursor: "pointer", display: "inline-block" }}
        >
          <Button
            sx={{
              bgcolor: "#222",
              color: "#fff",
              fontWeight: 600,
              textTransform: "none",
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1,
              "&:hover": { bgcolor: "#2c2c2c" },
            }}
          >
            View Full Schedule
            <motion.span animate={{ scale: hovered ? 1.4 : 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
              <ArrowForwardIcon />
            </motion.span>
          </Button>
        </motion.button>
      </Box>
      {/* displays the list of events */}
      <EventList events={events} variant="basic" />
    </Box>
  );
}
