'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from "../firebaseConfig";

// live session data (for path on button)
interface LiveSession {
  live: boolean;
  year: string;
  round: string;
  session: string;
}

// displays navigation bar (app bar)
export default function Navbar() {
  // defines session data (empty - won't show)
  const [session, setSession] = useState<LiveSession>({ live: false, year: "", round: "", session: "" });

  // fetches live session data
  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "live", "session"));
      const d = snap.exists() ? (snap.data() as Partial<LiveSession>) : null;
      if (d?.live && d.year && d.round && d.session) {
        setSession({ live: true, year: d.year, round: d.round, session: d.session });
      }
    })();
  }, []);

  return (
    // displays app bar background
    <AppBar position="static">
      <Toolbar>
        {/* shows home button */}
        <BrandLogo />

        {/* displays live button - if there is a live session */}
        <Box sx={{ ml: "auto" }} display="flex" alignItems="center" gap={2}>
          {session.live && (
            <Button
              variant="outlined"
              sx={{
                color: 'red', borderColor: 'red', fontWeight: 'bold', ml: 2, textTransform: 'none',
                display: 'flex', alignItems: 'center', px: 1.5, py: 0.5, borderRadius: '12px', height: 38
              }}
              component={Link}
              href={`/liveDash/${session.year}/${session.round}/${session.session}`}
            >
              <Box
                sx={{
                  width: 10, height: 10, borderRadius: '50%', backgroundColor: 'red', mr: 1,
                  animation: 'flash 1s infinite ease-in-out',
                }}
              />
              LIVE
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

// defines jump in animation
const letterVariants = {
  initial: { y: 0 },
  hover: (i: number) => ({
    y: [-10, 4, 0],
    transition: { delay: i * 0.05, duration: 0.5, ease: 'easeOut', type: 'tween' },
  }),
};

// home button
const BrandLogo = () => {
  const [isHovered, setIsHovered] = useState(false);
  const letters = 'Metrics'.split('');
  const titleSx = { fontSize: 24, fontWeight: 'bold', fontFamily: 'inherit', transition: 'color 0.3s ease', mr: 0.5 };

  return (
    // when hovered, animation starts
    <motion.div onHoverStart={() => setIsHovered(true)} onHoverEnd={() => setIsHovered(false)}>
      <Box
        component={Link}
        href="/"
        sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', px: 0, borderRadius: 2, fontFamily: 'inherit' }}
      >
        {/* switches colour to red on hover */}
        <Typography variant="h6" sx={{ ...titleSx, color: isHovered ? 'red' : 'inherit' }}>F1</Typography>
        <Typography variant="h6" sx={titleSx}>-</Typography>
        {letters.map((char, i) => (
          // jumping letter animation
          <motion.span
            key={i}
            custom={i}
            initial="initial"
            animate={isHovered ? 'hover' : 'initial'}
            variants={letterVariants}
            style={{ display: 'inline-block', fontSize: 24, fontWeight: 'bold', fontFamily: 'inherit', color: 'inherit' }}
          >
            {char}
          </motion.span>
        ))}
      </Box>
    </motion.div>
  );
};