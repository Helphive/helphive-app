import dayjs from "dayjs";
import { getDisplayStatus, type DisplayStatus } from "@/lib/format";
import type { Booking } from "./types";

/** The platform keeps 5% of each order (same as the web's PLATFORM_FEE_RATE). */
export const PLATFORM_FEE_RATE = 0.05;

/** Gross order value: hourly rate times hours. */
export const orderTotal = (b: Pick<Booking, "rate" | "hours">) => (Number(b.rate) || 0) * (Number(b.hours) || 0);

/** What the provider keeps after the platform fee. */
export const orderEarnings = (b: Pick<Booking, "rate" | "hours">) => orderTotal(b) * (1 - PLATFORM_FEE_RATE);

/** Short reference shown to people, the same one the web and the receipt use. */
export const orderCode = (b: Pick<Booking, "_id" | "reference">) =>
	b.reference || `HH-${String(b._id).slice(-8).toUpperCase()}`;

/** Venue name or street: the picked place's name, else the part of the address before the first comma. */
export const venueName = (b: Pick<Booking, "address" | "location">) =>
	b.location?.placeName || (b.address ?? "").split(",")[0]?.trim() || "Address";

export const timeRange = (b: Pick<Booking, "startDate" | "hours">) => {
	const start = dayjs(b.startDate);
	return `${start.format("HH:mm")} to ${start.add(Number(b.hours) || 0, "hour").format("HH:mm")}`;
};

/** "ddd D MMM", the date format the design system uses for bookings. */
export const formatDay = (date: string | Date) => dayjs(date).format("ddd D MMM");

export const pluralHours = (hours: number) => `${hours} ${hours === 1 ? "hour" : "hours"}`;

const startMs = (b: Pick<Booking, "startDate">) => new Date(b.startDate).getTime();
export const byStartAsc = (a: Booking, b: Booking) => startMs(a) - startMs(b);

const isLive = (status: DisplayStatus) => status !== "cancelled" && status !== "expired";

/** The provider's jobs that start today (not cancelled or expired), earliest first. */
export const jobsToday = (orders: Booking[] | undefined): Booking[] =>
	(orders ?? [])
		.filter((b) => isLive(getDisplayStatus(b)) && dayjs(b.startDate).isSame(dayjs(), "day"))
		.sort(byStartAsc);

/** Accepted jobs that have not started yet and start from now on. */
export const upcomingJobs = (orders: Booking[] | undefined): Booking[] =>
	(orders ?? [])
		.filter((b) => {
			const s = getDisplayStatus(b);
			return (s === "accepted" || s === "awaiting_start_approval") && startMs(b) >= Date.now() - 3600_000;
		})
		.sort(byStartAsc);

export type OrderTab = "active" | "completed" | "cancelled";

export const orderTabOf = (b: Booking): OrderTab => {
	const s = getDisplayStatus(b);
	if (s === "completed") return "completed";
	if (s === "cancelled" || s === "expired") return "cancelled";
	return "active";
};

/** Straight-line distance in km between two points (haversine). */
export const distanceKm = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
	const rad = (d: number) => (d * Math.PI) / 180;
	const dLat = rad(b.latitude - a.latitude);
	const dLng = rad(b.longitude - a.longitude);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
	return 6371 * 2 * Math.asin(Math.sqrt(h));
};

/** "1.2 km away" / "350 m away", or null without both positions. */
export const describeDistance = (
	from: { latitude: number | null; longitude: number | null } | null | undefined,
	to: Pick<Booking, "latitude" | "longitude">,
): string | null => {
	if (from?.latitude == null || from?.longitude == null || to.latitude == null || to.longitude == null) return null;
	if (from.latitude === 0 && from.longitude === 0) return null;
	const km = distanceKm(
		{ latitude: from.latitude, longitude: from.longitude },
		{ latitude: to.latitude, longitude: to.longitude },
	);
	return km < 1
		? `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m away`
		: `${km.toFixed(km < 10 ? 1 : 0)} km away`;
};
