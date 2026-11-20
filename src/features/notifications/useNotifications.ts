import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useToast } from "@/ui";
import { useAuthCheck } from "@/features/auth/useAuthCheck";
import { roleOf } from "@/features/auth/types";
import {
	useDeleteNotificationMutation,
	useGetNotificationsPageQuery,
	useMarkAllNotificationsReadMutation,
	useMarkNotificationReadMutation,
	type AppNotification,
	type NotificationFilter,
} from "./api";
import { resolveNotificationTarget } from "./openFromPush";

export type DayGroup = "Today" | "Yesterday" | "Earlier";

export type NotificationRow =
	| { kind: "header"; key: string; title: DayGroup }
	| { kind: "item"; key: string; notification: AppNotification; first: boolean; last: boolean };

/** Rows for the list: a Today / Yesterday / Earlier label, then that day's notifications (input is newest first). */
export const groupByDay = (items: AppNotification[]): NotificationRow[] => {
	const today = dayjs().startOf("day");
	const yesterday = today.subtract(1, "day");
	const groupOf = (n: AppNotification): DayGroup => {
		const created = dayjs(n.createdAt);
		return !created.isBefore(today) ? "Today" : !created.isBefore(yesterday) ? "Yesterday" : "Earlier";
	};
	const rows: NotificationRow[] = [];
	items.forEach((n, i) => {
		const group = groupOf(n);
		const first = i === 0 || groupOf(items[i - 1]) !== group;
		const last = i === items.length - 1 || groupOf(items[i + 1]) !== group;
		if (first) rows.push({ kind: "header", key: `header-${group}`, title: group });
		rows.push({ kind: "item", key: n._id, notification: n, first, last });
	});
	return rows;
};

/** The notification centre: filter, paging, pull to refresh, open (marks read), delete and mark all read. */
export function useNotifications() {
	const navigation = useNavigation();
	const toast = useToast();
	const role = roleOf(useAuthCheck().userDetails) ?? "user";
	const [filter, setFilter] = useState<NotificationFilter>("all");
	const [cursor, setCursor] = useState<string | undefined>(undefined);
	const [refreshing, setRefreshing] = useState(false);

	const query = useGetNotificationsPageQuery({ filter, cursor }, { refetchOnMountOrArgChange: 30 });
	const { data, isFetching, isError, refetch } = query;
	const [markRead] = useMarkNotificationReadMutation();
	const [markAllRead, markAllState] = useMarkAllNotificationsReadMutation();
	const [deleteNotification] = useDeleteNotificationMutation();

	const rows = useMemo(() => groupByDay(data?.notifications ?? []), [data?.notifications]);

	const reloadFirstPage = useCallback(() => {
		// A cursor change alone makes RTK Query refetch the first page and replace the merged list.
		if (cursor) setCursor(undefined);
		else void refetch();
	}, [cursor, refetch]);

	// Clear the pull-to-refresh spinner once the refresh has finished.
	const sawFetching = useRef(false);
	useEffect(() => {
		if (!refreshing) return;
		if (isFetching) sawFetching.current = true;
		else if (sawFetching.current) {
			sawFetching.current = false;
			setRefreshing(false);
		}
	}, [refreshing, isFetching]);

	// Back from a booking: read states may have changed elsewhere.
	const firstFocus = useRef(true);
	useFocusEffect(
		useCallback(() => {
			if (firstFocus.current) firstFocus.current = false;
			else reloadFirstPage();
		}, [reloadFirstPage]),
	);

	const open = useCallback(
		(n: AppNotification) => {
			if (!n.read) {
				markRead({ notificationId: n._id })
					.unwrap()
					.catch(() => toast.error("Could not mark the notification as read."));
			}
			const target = resolveNotificationTarget(n, role);
			if (!target) return;
			if (target.screen === "Earnings") navigation.navigate("Earnings", undefined, { pop: true });
			else navigation.navigate(target.screen, { bookingId: target.bookingId }, { pop: true });
		},
		[markRead, navigation, role, toast],
	);

	const remove = useCallback(
		(n: AppNotification) => {
			deleteNotification({ notificationId: n._id })
				.unwrap()
				.then(() => toast.success("Notification deleted"))
				.catch(() => toast.error("Could not delete the notification. Try again."));
		},
		[deleteNotification, toast],
	);

	const markAll = useCallback(() => {
		markAllRead()
			.unwrap()
			.then(() => toast.success("All notifications marked as read"))
			.catch(() => toast.error("Could not mark notifications as read. Try again."));
	}, [markAllRead, toast]);

	return {
		filter,
		setFilter: (next: NotificationFilter) => {
			if (next === filter) return;
			setCursor(undefined);
			setFilter(next);
		},
		rows,
		unreadCount: data?.unreadCount ?? 0,
		isLoading: query.isLoading || (isFetching && !data),
		isError,
		hasData: !!data,
		loadingMore: isFetching && !!cursor,
		loadMore: () => {
			if (data?.hasMore && data.nextCursor && !isFetching && !isError) setCursor(data.nextCursor);
		},
		retry: () => void refetch(),
		refreshing,
		refresh: () => {
			sawFetching.current = false;
			setRefreshing(true);
			reloadFirstPage();
		},
		open,
		remove,
		markAll,
		markingAll: markAllState.isLoading,
	};
}
