import type { NavigationContainerRefWithCurrent } from "@react-navigation/native";
import store from "@/store";
import { authApiSlice } from "@/features/auth/api";
import { roleOf, type Role } from "@/features/auth/types";
import type { RootStackParamList } from "@/navigation/types";
import type { AppNotification } from "./api";

/**
 * OneSignal `additionalData` (app-identity-contract.md section 3): `screen`, `bookingId`, `type`; chat pushes
 * (type "chat_message", screen "Chat") add `senderUid`, `deepLink` (helphive://chat/<uid>) and `webUrl`.
 */
interface PushData {
	screen?: string;
	bookingId?: string;
	type?: string;
	senderUid?: string;
	deepLink?: string;
}

const ID = /^[a-f\d]{24}$/i;

const currentRole = (): Role | null => roleOf(authApiSlice.endpoints.fetchUserDetails.select()(store.getState()).data);

/** The uid of the person who sent a chat push: `senderUid`, or the end of `deepLink`. */
const chatUid = ({ senderUid, deepLink }: PushData) => {
	const uid = senderUid ?? deepLink?.match(/chat\/([a-f\d]{24})/i)?.[1];
	return uid && ID.test(uid) ? uid : undefined;
};

/** Opens the screen a tapped push points at. Unknown screens are ignored (the app just opens). */
export const openFromPush = (data: unknown, navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>) => {
	if (!navigationRef.isReady() || !data || typeof data !== "object") return;
	const push = data as PushData;
	const { screen, bookingId, type } = push;
	if (screen === "Chat" || type === "chat_message") {
		const uid = chatUid(push);
		const params = { screen: "ChatTab" as const, params: uid ? { uid } : undefined };
		if (currentRole() === "provider") navigationRef.navigate("ProviderHome", params);
		else navigationRef.navigate("CustomerHome", params);
		return;
	}
	const target = resolveNotificationTarget({ screen, bookingId, type }, currentRole() ?? "user");
	if (!target) return;
	if (target.screen === "Earnings") navigationRef.navigate("Earnings");
	else navigationRef.navigate(target.screen, { bookingId: target.bookingId });
};

type Target =
	| { screen: "Earnings" }
	| { screen: "BookingDetails" | "MyOrderDetails" | "AcceptOrder"; bookingId: string };

/** Where a notification (stored or pushed) goes for this role, or null when it is informational only. */
export const resolveNotificationTarget = (
	n: Pick<AppNotification, "type" | "screen" | "bookingId" | "data"> | PushData,
	role: Role,
): Target | null => {
	const fromData = "data" in n && typeof n.data?.bookingId === "string" ? n.data.bookingId : undefined;
	const bookingId = n.bookingId || fromData;
	const type = n.type ?? "general";
	if (n.screen === "Earnings" || type === "payout_paid") return role === "provider" ? { screen: "Earnings" } : null;
	if (!bookingId) return null;
	// The stored screen may belong to the other role; keep it role-correct.
	if (role === "user") return { screen: "BookingDetails", bookingId };
	const known = n.screen === "BookingDetails" || n.screen === "MyOrderDetails" || n.screen === "AcceptOrder";
	const accept = n.screen === "AcceptOrder" || (!known && type === "booking_created");
	return { screen: accept ? "AcceptOrder" : "MyOrderDetails", bookingId };
};
