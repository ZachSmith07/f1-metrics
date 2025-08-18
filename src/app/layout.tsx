// sets up global styles and themes

import type { Metadata } from "next";
// Global styles (reset + shared CSS)
import "./globals.css";
// provides global styles for MUI
import Providers from "./providers";

// Defines title of the tab, and gives description
export const metadata: Metadata = {
	title: "F1-Metrics",
	description: "F1 analytics and standings dashboard",
};

// applies the layout to each page
export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>
				{/* wraps the page content with the provider - so theme and globals are provided everywhere */}
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
