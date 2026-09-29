import { useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useGetUnreadCountQuery } from "./notificationsApiSlice";

const POLL_INTERVAL_MS = 60000;

/** Unread notification count for the bell badge; polls while mounted and refetches whenever the screen regains focus. */
export const useUnreadCount = () => {
	const { data, refetch } = useGetUnreadCountQuery(undefined, { pollingInterval: POLL_INTERVAL_MS });
	const firstFocus = useRef(true);

	useFocusEffect(
		useCallback(() => {
			// The initial fetch is already in flight on mount; only refetch on later focuses.
			if (firstFocus.current) {
				firstFocus.current = false;
				return;
			}
			refetch();
		}, [refetch]),
	);

	return data?.unreadCount ?? 0;
};

export default useUnreadCount;
