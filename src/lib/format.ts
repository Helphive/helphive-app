import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export const formatMoney = (amount?: number | null, currency = "usd") =>
	new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(Number(amount) || 0);

export const formatDate = (date?: string | Date | null) => (date ? dayjs(date).format("D MMM YYYY") : "—");

export const formatDateTime = (date?: string | Date | null) => (date ? dayjs(date).format("D MMM YYYY, h:mm A") : "—");

export const formatTimeAgo = (date?: string | Date | null) => (date ? dayjs(date).fromNow() : "");

export type DisplayStatus =
	| "scheduled"
	| "accepted"
	| "awaiting_start_approval"
	| "in_progress"
	| "completed"
	| "cancelled"
	| "expired";

// Colors reference the success/warning/error tokens in theme.ts.
export const STATUS_META: Record<DisplayStatus, { label: string; color: string; background: string }> = {
	scheduled: { label: "Scheduled", color: "#B54708", background: "#FFFAEB" },
	accepted: { label: "Accepted", color: "#175CD3", background: "#EFF8FF" },
	awaiting_start_approval: { label: "Awaiting approval", color: "#6941C6", background: "#F4F3FF" },
	in_progress: { label: "In progress", color: "#FF5740", background: "#FFF1EE" },
	completed: { label: "Completed", color: "#067647", background: "#ECFDF3" },
	cancelled: { label: "Cancelled", color: "#B42318", background: "#FEF3F2" },
	expired: { label: "Expired", color: "#475467", background: "#F2F4F7" },
};

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
