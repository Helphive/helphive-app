import { useCallback, useEffect, useMemo, useRef } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import store from "@/store";
import { apiSlice } from "@/services/api/apiSlice";
import { useAuthCheck } from "@/features/auth/useAuthCheck";
import { roleOf, type Role } from "@/features/auth/types";
import { useGetUserBookingsQuery } from "@/features/customer/api";
import { useGetMyOrdersQuery } from "@/features/provider/api";
import { chatRuntime } from "./chatRuntime";
import { claimOf, groupByPerson, type PairBooking } from "./bookingEvents";

const LIST_TAG = {
	user: { type: "Booking" as const, id: "USER_LIST" },
	provider: { type: "Booking" as const, id: "MINE_LIST" },
};

// Several screens can ask at once (the list under an open conversation): one reload per second is enough.
let lastReload = 0;
const reload = (role: Role) => {
	if (Date.now() - lastReload < 1000) return;
	lastReload = Date.now();
	store.dispatch(apiSlice.util.invalidateTags([LIST_TAG[role]]));
};

/**
 * The viewer's bookings grouped by the other person ("the pair's bookings"), from the lists the app already loads:
 * a customer's `user/bookings`, a provider's `provider/my-orders`. One request for every card and the header, never one
 * per card. Kept live: reloaded when the screen regains focus, when the app returns to the foreground, and when a
 * message that claims to be a booking event arrives.
 */
export function usePairBookings() {
	const role = roleOf(useAuthCheck().userDetails);
	const options = { refetchOnMountOrArgChange: 30 };
	const user = useGetUserBookingsQuery(undefined, { skip: role !== "user", ...options });
	const provider = useGetMyOrdersQuery(undefined, { skip: role !== "provider", ...options });
	const data = role === "user" ? user.data : role === "provider" ? provider.data : undefined;
	const loaded = !!data;

	const byPerson = useMemo(() => {
		if (!data || !role) return new Map<string, PairBooking[]>();
		const list: PairBooking[] = Array.isArray(data) ? data : [...data.active, ...data.scheduled, ...data.history];
		return groupByPerson(list, role);
	}, [data, role]);

	const refresh = useCallback(() => {
		if (role) reload(role);
	}, [role]);

	// Focus: not the first one (the mount already loads).
	const focused = useRef(false);
	useFocusEffect(
		useCallback(() => {
			if (focused.current) refresh();
			focused.current = true;
		}, [refresh]),
	);

	useEffect(() => {
		const sub = AppState.addEventListener("change", (s) => {
			if (s === "active") refresh();
		});
		const off = chatRuntime.onEvent((e) => {
			if (e.type === "message" && claimOf(e.message)) refresh();
		});
		return () => {
			sub.remove();
			off();
		};
	}, [refresh]);

	return { role, byPerson, loaded };
}
