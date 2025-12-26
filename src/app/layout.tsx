// sets up global styles and themes

import type { Metadata } from "next";
// Global styles (reset + shared CSS)
import "./globals.css";
// provides global styles for MUI
import Providers from "./providers";
import { exo2 } from "./styles";
import Script from "next/script";

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
		<html lang="en" className={exo2.className}>
			<body>
				<Script
					src="https://www.googletagmanager.com/gtag/js?id=G-F3FKB452VP"
					strategy="afterInteractive"
				/>
				<Script id="google-analytics" strategy="afterInteractive">
					{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-F3FKB452VP');
          `}
				</Script>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
