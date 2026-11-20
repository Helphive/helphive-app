import React, { useCallback } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	Button,
	Count,
	EmptyState,
	ErrorState,
	ListSkeleton,
	Screen,
	ScreenHeader,
	Skeleton,
	Text,
	layout,
	space,
	makeStyles,
	useTheme,
} from "@/ui";
import { CheckMarkIcon, NotificationsIcon } from "@/ui/icons";
import type { NotificationFilter } from "../api";
import { useNotifications, type NotificationRow } from "../useNotifications";
import NotificationCard from "../components/NotificationCard";

const FILTERS: { value: NotificationFilter; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "unread", label: "Unread" },
];

/** Notification centre (both roles): grouped by day, unread first in weight, tap to open the booking or order. */
export default function NotificationsScreen() {
	const { color } = useTheme();
	const styles = useStyles();
	const n = useNotifications();
	// Edge to edge: the list scrolls under the navigation bar, so its end clears it.
	const { bottom } = useSafeAreaInsets();

	const renderItem = useCallback(
		({ item }: { item: NotificationRow }) =>
			item.kind === "header" ? (
				<Text variant="caption" color="ink600" accessibilityRole="header" style={styles.group}>
					{item.title}
				</Text>
			) : (
				<NotificationCard
					notification={item.notification}
					first={item.first}
					last={item.last}
					onOpen={n.open}
					onDelete={n.remove}
				/>
			),
		[n.open, n.remove],
	);

	const tabs = (
		<View style={styles.tabs} accessibilityRole="tablist">
			{FILTERS.map((f) => {
				const active = n.filter === f.value;
				return (
					<Pressable
						key={f.value}
						accessibilityRole="tab"
						accessibilityState={{ selected: active }}
						accessibilityLabel={
							f.value === "unread" && n.unreadCount ? `Unread, ${n.unreadCount}` : f.label
						}
						onPress={() => n.setFilter(f.value)}
						style={[styles.tab, active && styles.tabActive]}
					>
						<Text variant="uiStrong" color={active ? "ink900" : "ink600"}>
							{f.label}
						</Text>
						{f.value === "unread" && n.unreadCount ? (
							<Count value={n.unreadCount > 99 ? "99+" : n.unreadCount} tone="coral" />
						) : null}
					</Pressable>
				);
			})}
		</View>
	);

	let body: React.ReactNode;
	if (n.isLoading) {
		body = (
			<View style={styles.pad}>
				<ListSkeleton rows={5} withHeader={false} />
			</View>
		);
	} else if (n.isError && !n.hasData) {
		body = (
			<View style={styles.pad}>
				<ErrorState
					title="Could not load notifications"
					message="Check your connection and try again."
					onRetry={n.retry}
				/>
			</View>
		);
	} else {
		body = (
			<FlatList
				data={n.rows}
				keyExtractor={(r) => r.key}
				renderItem={renderItem}
				onEndReached={n.loadMore}
				onEndReachedThreshold={0.4}
				contentContainerStyle={[styles.list, { paddingBottom: space[8] + bottom }]}
				refreshControl={
					<RefreshControl
						refreshing={n.refreshing}
						onRefresh={n.refresh}
						tintColor={color.ink900}
						colors={[color.ink900]}
					/>
				}
				ListEmptyComponent={
					<EmptyState
						icon={NotificationsIcon}
						title={n.filter === "unread" ? "No unread notifications" : "No notifications yet"}
						description={
							n.filter === "unread"
								? "You are all caught up."
								: "Booking, payment and account updates will show up here."
						}
					/>
				}
				ListFooterComponent={
					n.loadingMore ? (
						<View style={styles.more} accessibilityLabel="Loading more notifications">
							<Skeleton height={64} radius={10} />
						</View>
					) : n.isError && n.rows.length > 0 ? (
						<View style={styles.more}>
							<Button variant="secondary" onPress={n.retry}>
								Could not load more. Try again
							</Button>
						</View>
					) : undefined
				}
			/>
		);
	}

	return (
		<Screen
			scroll={false}
			header={
				<ScreenHeader
					title="Notifications"
					actions={
						<Button
							variant="text"
							size="sm"
							icon={CheckMarkIcon}
							onPress={n.markAll}
							loading={n.markingAll}
							disabled={n.unreadCount === 0 || n.markingAll}
							accessibilityLabel="Mark all as read"
						>
							Mark all read
						</Button>
					}
				/>
			}
		>
			{tabs}
			{body}
		</Screen>
	);
}

const useStyles = makeStyles(({ color }) => ({
	tabs: {
		flexDirection: "row",
		gap: space[5],
		paddingHorizontal: layout.gutter,
		backgroundColor: color.surface,
		borderBottomWidth: 1,
		borderBottomColor: color.line,
	},
	tab: {
		flexDirection: "row",
		alignItems: "center",
		gap: space[2],
		minHeight: 44,
		borderBottomWidth: 2,
		borderBottomColor: "transparent",
	},
	tabActive: { borderBottomColor: color.ink900 },
	pad: { padding: layout.gutter },
	list: { flexGrow: 1, paddingHorizontal: layout.gutter, paddingBottom: space[8] },
	group: { marginTop: space[4], marginBottom: space[2] },
	more: { paddingVertical: space[4], alignItems: "center" },
}));
