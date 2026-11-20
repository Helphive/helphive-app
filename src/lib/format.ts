import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export const formatMoney = (amount?: number | null, currency = "usd") =>
	new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(Number(amount) || 0);

export const formatDate = (date?: string | Date | null) => (date ? dayjs(date).format("D MMM YYYY") : "—");

export const formatDateTime = (date?: string | Date | null) => (date ? dayjs(date).format("D MMM YYYY, h:mm A") : "—");

/** Day of a shift, "Fri 24 Jan"; adds the year when it is not this year (same as the web). */
export const formatDay = (date?: string | Date | dayjs.Dayjs | null) => {
	if (!date) return "—";
	const d = dayjs(date);
	return d.format(d.isSame(dayjs(), "year") ? "ddd D MMM" : "ddd D MMM YYYY");
};

/** 24-hour clock time, "08:30". */
export const formatTime = (date?: string | Date | dayjs.Dayjs | null) => (date ? dayjs(date).format("HH:mm") : "—");

/** Day and 24-hour time, "Fri 24 Jan, 08:30". */
export const formatDayTime = (date?: string | Date | dayjs.Dayjs | null) =>
	date ? `${formatDay(date)}, ${formatTime(date)}` : "—";

export const pluralHours = (hours?: number) => `${hours || 0} ${(hours || 0) === 1 ? "hour" : "hours"}`;

export const formatTimeAgo = (date?: string | Date | null) => (date ? dayjs(date).fromNow() : "");

export type DisplayStatus =
	| "scheduled"
	| "accepted"
	| "awaiting_start_approval"
	| "in_progress"
	| "completed"
	| "cancelled"
	| "expired";

// Mirrors the backend's derived `displayStatus`, for bookings fetched before it existed.
export const getDisplayStatus = (booking: any): DisplayStatus => {
	if (booking?.displayStatus) return booking.displayStatus;
	switch (booking?.status) {
		case "completed":
			return "completed";
		case "cancelled":
			return "cancelled";
		case "in progress":
			return "in_progress";
		default:
			if (booking?.userApprovalRequested) return "awaiting_start_approval";
			if (booking?.providerId) return "accepted";
			return booking?.startDate && dayjs(booking.startDate).isBefore(dayjs()) ? "expired" : "scheduled";
	}
};
