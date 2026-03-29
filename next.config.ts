import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
			},
			{
				protocol: "https",
				hostname: "lh4.googleusercontent.com",
			},
			{
				protocol: "https",
				hostname: "lh5.googleusercontent.com",
			},
			{
				protocol: "https",
				hostname: "lh6.googleusercontent.com",
			},
			{
				protocol: "https",
				hostname: "saa.sun-asterisk.vn",
			},
			{
				// Supabase cloud storage (production)
				protocol: "https",
				hostname: "*.supabase.co",
				pathname: "/storage/v1/object/public/**",
			},
			{
				// Supabase local dev storage
				protocol: "http",
				hostname: "127.0.0.1",
				port: "54321",
				pathname: "/storage/v1/object/public/**",
			},
		],
	},
};

export default withNextIntl(nextConfig);

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
