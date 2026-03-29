import type { Metadata } from "next";
import { Montserrat, Montserrat_Alternates } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

const montserrat = Montserrat({
	subsets: ["latin", "vietnamese"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-montserrat",
	display: "swap",
});

const montserratAlternates = Montserrat_Alternates({
	subsets: ["latin"],
	weight: ["700"],
	variable: "--font-montserrat-alt",
	display: "swap",
});

export const metadata: Metadata = {
	title: "SAA 2025 — Sun Annual Awards",
	description: "Sun Annual Awards 2025 — ROOT FURTHER",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<html lang={locale} suppressHydrationWarning>
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
			</head>
			<body className={`${montserrat.variable} ${montserratAlternates.variable} antialiased`}>
				<NextIntlClientProvider locale={locale} messages={messages}>
					{children}
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
