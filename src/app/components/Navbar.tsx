'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';
import type { Variants } from 'framer-motion';

const MotionButton = motion(Button);
import { doc, getDoc } from 'firebase/firestore';
import { db } from "../firebaseConfig";

interface LiveSession {
	live: boolean;
	year: string;
	round: string;
	session: string;
}

export default function Navbar() {
	useEffect(() => { getLiveSessionData() }, []);

	const [session, setSession] = useState<LiveSession>({ live: false, year: "", round: "", session: "" });


	async function getLiveSessionData() {
		const docRef = doc(db, "live", "session");
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			const data = docSnap.data() as Partial<{
				live: boolean;
				year: string;
				round: string;
				session: string;
			}>;
			if (data.live == true && data.year && data.round && data.session) {
				setSession({
					live: data.live,
					year: data.year,
					round: data.round,
					session: data.session
				});
			}
		}
	}



	return (
		<AppBar position="static">
			<Toolbar>
				<BrandLogo />
				<Box sx={{ marginLeft: "auto" }} flexDirection={"row"} display={"flex"} gap={2} alignItems={"center"}>
					{
						session.live && <Button
							variant="outlined"
							sx={{
								color: 'red',
								borderColor: 'red',
								fontWeight: 'bold',
								ml: 2,
								textTransform: 'none',
								display: 'flex',
								alignItems: 'center',
								px: 1.5,
								py: 0.5,
								borderRadius: '12px',
								height: "38px"
							}}
							component={Link}
							href={`/liveDash/${session.year}/${session.round}/${session.session}`}
						>
							<Box
								sx={{
									width: 10,
									height: 10,
									borderRadius: '50%',
									backgroundColor: 'red',
									marginRight: 1,
									animation: 'flash 1s infinite ease-in-out',
								}}
							/>
							LIVE
						</Button>
					}
				</Box>
			</Toolbar>
		</AppBar>
	);
}

const letterVariants: Variants = {
	initial: { y: 0 },
	hover: (i: number) => ({
		y: [-10, 4, 0],
		transition: {
			delay: i * 0.05,
			duration: 0.5,
			ease: 'easeOut', // or 'easeInOut' if you prefer
			type: 'tween',   // 👈 fixes the multiple keyframes issue
		},
	}),
};


const BrandLogo = () => {
	const [isHovered, setIsHovered] = useState(false);
	const letters = 'Metrics'.split('');

	return (
		<motion.div
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
		>
			<Box
				component={Link}
				href="/"
				sx={{
					display: 'flex',
					alignItems: 'center',
					textDecoration: 'none',
					px: 0,
					borderRadius: 2,
					fontFamily: 'inherit',
				}}
			>
				<Typography
					variant="h6"
					sx={{
						fontSize: 24,
						fontWeight: 'bold',
						fontFamily: 'inherit',
						color: isHovered ? 'red' : 'inherit',
						transition: 'color 0.3s ease',
						mr: 0.5,
					}}
				>
					F1
				</Typography>
				<Typography
					variant="h6"
					sx={{
						fontSize: 24,
						fontWeight: 'bold',
						fontFamily: 'inherit',
						transition: 'color 0.3s ease',
						mr: 0.5,
					}}
				>
					-
				</Typography>
				{letters.map((char, i) => (
					<motion.span
						key={i}
						custom={i}
						initial="initial"
						animate={isHovered ? 'hover' : 'initial'}
						variants={letterVariants}
						style={{
							display: 'inline-block',
							fontSize: '24px',
							fontWeight: 'bold',
							fontFamily: 'inherit',
							color: 'inherit',
						}}
					>
						{char}
					</motion.span>
				))}
			</Box>
		</motion.div>
	);
};
