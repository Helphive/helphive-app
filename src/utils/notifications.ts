export const handleNotificationScreen = (notification: any, navigationRef: any) => {
	const screen = notification?.notification?.additionalData?.screen;
	if (navigationRef.current) {
		if (screen === "BookingDetails") {
			const bookingId = notification?.notification?.additionalData?.bookingId;
			navigationRef.current.navigate("BookingDetails", { bookingId });
		} else if (screen === "MyOrderDetails") {
			const bookingId = notification?.notification?.additionalData?.bookingId;
			navigationRef.current.navigate("MyOrderDetails", { bookingId });
		} else if (screen === "AcceptOrder") {
			const bookingId = notification?.notification?.additionalData?.bookingId;
			navigationRef.current.navigate("AcceptOrder", { bookingId });
		} else if (screen === "Earnings") {
			navigationRef.current.navigate("Earnings");
		}
	}
};

// ---- Notification center helpers ----

export type NotificationRole = "user" | "provider";

export const NOTIFICATION_META: Record<string, { icon: string; color: string; background: string }> = {
	booking_created: { icon: "calendar-plus", color: "#175CD3", background: "#EFF8FF" },
	booking_accepted: { icon: "account-check-outline", color: "#175CD3", background: "#EFF8FF" },
	booking_start_requested: { icon: "play-circle-outline", color: "#6941C6", background: "#F4F3FF" },
	booking_started: { icon: "progress-clock", color: "#FF5740", background: "#FFF1EE" },
	booking_completed: { icon: "check-circle-outline", color: "#067647", background: "#ECFDF3" },
	booking_cancelled: { icon: "close-circle-outline", color: "#B42318", background: "#FEF3F2" },
	booking_expired: { icon: "calendar-remove-outline", color: "#475467", background: "#F2F4F7" },
	payment_succeeded: { icon: "credit-card-check-outline", color: "#067647", background: "#ECFDF3" },
	payment_refunded: { icon: "cash-refund", color: "#B54708", background: "#FFFAEB" },
	payout_paid: { icon: "bank-transfer-in", color: "#067647", background: "#ECFDF3" },
	account_approved: { icon: "shield-check-outline", color: "#067647", background: "#ECFDF3" },
	account_rejected: { icon: "shield-alert-outline", color: "#B42318", background: "#FEF3F2" },
	general: { icon: "bell-outline", color: "#475467", background: "#F2F4F7" },
};

export const getNotificationMeta = (type?: string) => NOTIFICATION_META[type ?? "general"] ?? NOTIFICATION_META.general;

const KNOWN_SCREENS = ["BookingDetails", "MyOrderDetails", "AcceptOrder", "Earnings"];

/** Where a tapped notification should go, or null if it is informational only. */
export const resolveNotificationTarget = (
	notification: any,
	role: NotificationRole,
): { screen: string; params?: { bookingId: string } } | null => {
	const bookingId: string | undefined = notification?.bookingId ?? notification?.data?.bookingId ?? undefined;
	const type: string = notification?.type ?? "general";

	let screen: string | undefined = KNOWN_SCREENS.includes(notification?.screen) ? notification.screen : undefined;
	if (!screen) {
		if (type === "payout_paid") screen = role === "provider" ? "Earnings" : undefined;
		else if (bookingId) {
			if (role === "user") screen = "BookingDetails";
			else screen = type === "booking_created" ? "AcceptOrder" : "MyOrderDetails";
		}
	}
	// A stored screen may belong to the other role (e.g. shared account); keep it role-correct.
	if (screen === "BookingDetails" && role === "provider") screen = "MyOrderDetails";
	if ((screen === "MyOrderDetails" || screen === "AcceptOrder") && role === "user") screen = "BookingDetails";

	if (!screen) return null;
	if (screen === "Earnings") return { screen };
	return bookingId ? { screen, params: { bookingId } } : null;
};

export type NotificationListItem =
	| { kind: "header"; key: string; title: string }
	| { kind: "item"; key: string; notification: any };

/** Flatten notifications into FlatList rows with Today / Yesterday / Earlier headers (input is newest first). */
export const groupNotificationsByDay = (notifications: any[]): NotificationListItem[] => {
	const now = new Date();
	const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
	const rows: NotificationListItem[] = [];
	let lastSection = "";
	notifications.forEach((n) => {
		const t = new Date(n.createdAt).getTime();
		const section = t >= startOfToday ? "Today" : t >= startOfYesterday ? "Yesterday" : "Earlier";
		if (section !== lastSection) {
			rows.push({ kind: "header", key: `header-${section}`, title: section });
			lastSection = section;
		}
		rows.push({ kind: "item", key: n._id, notification: n });
	});
	return rows;
};
