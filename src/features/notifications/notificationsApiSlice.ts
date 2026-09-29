import { apiSlice } from "../../app/api/apiSlice";

export type NotificationType =
	| "booking_created"
	| "booking_accepted"
	| "booking_start_requested"
	| "booking_started"
	| "booking_completed"
	| "booking_cancelled"
	| "booking_expired"
	| "payment_succeeded"
	| "payment_refunded"
	| "payout_paid"
	| "account_approved"
	| "account_rejected"
	| "general";

export interface AppNotification {
	_id: string;
	title: string;
	message: string;
	type: NotificationType;
	screen?: string;
	data?: Record<string, any>;
	bookingId?: string | null;
	read: boolean;
	createdAt: string;
	updatedAt?: string;
}

export type NotificationFilter = "all" | "unread";

export interface NotificationsPage {
	notifications: AppNotification[];
	nextCursor: string | null;
	hasMore: boolean;
	unreadCount: number;
}

export interface NotificationsArgs {
	filter: NotificationFilter;
	/** Omit for the first page. Changing only the cursor loads the next page and merges it into the cache. */
	cursor?: string;
}

export const NOTIFICATIONS_PAGE_SIZE = 20;

export const notificationsApiSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getNotificationsPage: builder.query<NotificationsPage, NotificationsArgs>({
			query: ({ filter, cursor }) => {
				const params = new URLSearchParams({ limit: String(NOTIFICATIONS_PAGE_SIZE), filter });
				if (cursor) params.set("cursor", cursor);
				return `notifications?${params.toString()}`;
			},
			// One cache entry per filter; pages are merged into it.
			serializeQueryArgs: ({ endpointName, queryArgs }) => `${endpointName}(${queryArgs.filter})`,
			merge: (current, incoming, { arg }) => {
				if (!arg.cursor) {
					// First page (initial load or pull-to-refresh) replaces everything.
					current.notifications = incoming.notifications;
				} else {
					const seen = new Set(current.notifications.map((n) => n._id));
					incoming.notifications.forEach((n) => {
						if (!seen.has(n._id)) current.notifications.push(n);
					});
				}
				current.nextCursor = incoming.nextCursor;
				current.hasMore = incoming.hasMore;
				current.unreadCount = incoming.unreadCount;
			},
			forceRefetch: ({ currentArg, previousArg }) => currentArg?.cursor !== previousArg?.cursor,
		}),
		getUnreadCount: builder.query<{ unreadCount: number }, void>({
			query: () => "notifications/unread-count",
		}),
		markNotificationRead: builder.mutation<any, { notificationId: string }>({
			query: ({ notificationId }) => ({
				url: "/mark-notification-read",
				method: "POST",
				body: { notificationId },
			}),
			async onQueryStarted({ notificationId }, { dispatch, queryFulfilled }) {
				const patches: { undo: () => void }[] = [];
				let wasUnread = false;
				(["all", "unread"] as NotificationFilter[]).forEach((filter) => {
					patches.push(
						dispatch(
							notificationsApiSlice.util.updateQueryData("getNotificationsPage", { filter }, (draft) => {
								const item = draft.notifications.find((n) => n._id === notificationId);
								if (item && !item.read) wasUnread = true;
								if (filter === "all" && item) item.read = true;
								if (filter === "unread")
									draft.notifications = draft.notifications.filter((n) => n._id !== notificationId);
							}),
						),
					);
				});
				if (wasUnread) {
					patches.push(
						dispatch(
							notificationsApiSlice.util.updateQueryData("getUnreadCount", undefined, (draft) => {
								draft.unreadCount = Math.max(0, draft.unreadCount - 1);
							}),
						),
					);
				}
				try {
					await queryFulfilled;
				} catch {
					patches.forEach((p) => p.undo());
				}
			},
		}),
		markAllNotificationsRead: builder.mutation<{ modifiedCount: number }, void>({
			query: () => ({ url: "notifications/mark-all-read", method: "POST" }),
			async onQueryStarted(_, { dispatch, queryFulfilled }) {
				const patches = [
					dispatch(
						notificationsApiSlice.util.updateQueryData(
							"getNotificationsPage",
							{ filter: "all" },
							(draft) => {
								draft.notifications.forEach((n) => (n.read = true));
								draft.unreadCount = 0;
							},
						),
					),
					dispatch(
						notificationsApiSlice.util.updateQueryData(
							"getNotificationsPage",
							{ filter: "unread" },
							(draft) => {
								draft.notifications = [];
								draft.hasMore = false;
								draft.nextCursor = null;
								draft.unreadCount = 0;
							},
						),
					),
					dispatch(
						notificationsApiSlice.util.updateQueryData("getUnreadCount", undefined, (draft) => {
							draft.unreadCount = 0;
						}),
					),
				];
				try {
					await queryFulfilled;
				} catch {
					patches.forEach((p) => p.undo());
				}
			},
		}),
		deleteNotification: builder.mutation<{ message: string }, { notificationId: string }>({
			query: ({ notificationId }) => ({ url: `notifications/${notificationId}`, method: "DELETE" }),
			async onQueryStarted({ notificationId }, { dispatch, queryFulfilled }) {
				const patches: { undo: () => void }[] = [];
				let wasUnread = false;
				(["all", "unread"] as NotificationFilter[]).forEach((filter) => {
					patches.push(
						dispatch(
							notificationsApiSlice.util.updateQueryData("getNotificationsPage", { filter }, (draft) => {
								const item = draft.notifications.find((n) => n._id === notificationId);
								if (item && !item.read) wasUnread = true;
								draft.notifications = draft.notifications.filter((n) => n._id !== notificationId);
							}),
						),
					);
				});
				if (wasUnread) {
					patches.push(
						dispatch(
							notificationsApiSlice.util.updateQueryData("getUnreadCount", undefined, (draft) => {
								draft.unreadCount = Math.max(0, draft.unreadCount - 1);
							}),
						),
					);
				}
				try {
					await queryFulfilled;
				} catch {
					patches.forEach((p) => p.undo());
				}
			},
		}),
	}),
});

export const {
	useGetNotificationsPageQuery,
	useGetUnreadCountQuery,
	useMarkNotificationReadMutation,
	useMarkAllNotificationsReadMutation,
	useDeleteNotificationMutation,
} = notificationsApiSlice;
