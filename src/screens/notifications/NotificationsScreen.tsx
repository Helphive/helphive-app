import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Image, RefreshControl, TouchableOpacity, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAppTheme } from "../../utils/theme";
import { RootStackParamList } from "../../utils/CustomTypes";
import {
	NotificationFilter,
	useDeleteNotificationMutation,
	useGetNotificationsPageQuery,
	useMarkAllNotificationsReadMutation,
	useMarkNotificationReadMutation,
} from "../../features/notifications/notificationsApiSlice";
import {
	NotificationListItem,
	NotificationRole,
	groupNotificationsByDay,
	resolveNotificationTarget,
} from "../../utils/notifications";
import NotificationCard from "../../components/NotificationCard";
import SectionHeader from "../../components/SectionHeader";
import EmptyState from "../../components/EmptyState";
import Skeleton from "../../components/Skeleton";
import CustomSnackbar from "../../components/CustomSnackbar";

const vector1 = require("../../../assets/cloud vectors/vector-1.png");
const vector2 = require("../../../assets/cloud vectors/vector-2.png");
const logo = require("../../../assets/Logo/logo-light.png");

const keyExtractor = (row: NotificationListItem) => row.key;

const LoadingSkeleton = () => (
	<View style={{ padding: 16 }}>
		{[0, 1, 2, 3, 4].map((i) => (
			<View key={i} style={{ flexDirection: "row", marginBottom: 12 }}>
				<Skeleton width={42} height={42} radius={21} />
				<View style={{ flex: 1, marginLeft: 12 }}>
					<Skeleton width="55%" height={14} />
					<Skeleton width="95%" height={12} style={{ marginTop: 8 }} />
					<Skeleton width="30%" height={10} style={{ marginTop: 8 }} />
				</View>
			</View>
		))}
	</View>
);

const NotificationsScreen = ({ role }: { role: NotificationRole }) => {
	const theme = useAppTheme();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const [filter, setFilter] = useState<NotificationFilter>("all");
	const [cursor, setCursor] = useState<string | undefined>(undefined);
	const [refreshing, setRefreshing] = useState(false);
	const [snackbar, setSnackbar] = useState<string | null>(null);
	const sawFetching = useRef(false);
	const firstFocus = useRef(true);

	const { data, isLoading, isFetching, isError, refetch } = useGetNotificationsPageQuery(
		{ filter, cursor },
		{ refetchOnMountOrArgChange: true },
	);
	const [markRead] = useMarkNotificationReadMutation();
	const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();
	const [deleteNotification] = useDeleteNotificationMutation();

	const notifications = data?.notifications;
	const unreadCount = data?.unreadCount ?? 0;
	const rows = useMemo(() => groupNotificationsByDay(notifications ?? []), [notifications]);
	const loadingMore = isFetching && !!cursor;

	// Reload from the first page (a cursor change alone makes RTK Query refetch and replace the merged list).
	const reloadFirstPage = useCallback(() => {
		if (cursor) setCursor(undefined);
		else refetch();
	}, [cursor, refetch]);

	const handleRefresh = useCallback(() => {
		sawFetching.current = false;
		setRefreshing(true);
		reloadFirstPage();
	}, [reloadFirstPage]);

	// Clear the pull-to-refresh spinner once the refresh request has started and then finished.
	useEffect(() => {
		if (!refreshing) return;
		if (isFetching) sawFetching.current = true;
		else if (sawFetching.current) {
			sawFetching.current = false;
			setRefreshing(false);
		}
	}, [refreshing, isFetching]);

	// Re-sync when returning from a detail screen (unread states may have changed elsewhere).
	useFocusEffect(
		useCallback(() => {
			if (firstFocus.current) {
				firstFocus.current = false;
				return;
			}
			reloadFirstPage();
		}, [reloadFirstPage]),
	);

	const changeFilter = (next: NotificationFilter) => {
		if (next === filter) return;
		setCursor(undefined);
		setFilter(next);
	};

	const handleEndReached = useCallback(() => {
		if (data?.hasMore && data.nextCursor && !isFetching && !isError) setCursor(data.nextCursor);
	}, [data?.hasMore, data?.nextCursor, isFetching, isError]);

	const handlePress = useCallback(
		async (notification: any) => {
			if (!notification.read) markRead({ notificationId: notification._id });
			const target = resolveNotificationTarget(notification, role);
			if (target) navigation.navigate(target.screen as any, target.params as any);
		},
		[markRead, navigation, role],
	);

	const handleDelete = useCallback(
		async (notification: any) => {
			try {
				await deleteNotification({ notificationId: notification._id }).unwrap();
			} catch {
				setSnackbar("Couldn't delete the notification. Please try again.");
			}
		},
		[deleteNotification],
	);

	const handleMarkAll = async () => {
		try {
			await markAllRead().unwrap();
		} catch {
			setSnackbar("Couldn't mark notifications as read. Please try again.");
		}
	};

	const renderItem = useCallback(
		({ item }: { item: NotificationListItem }) =>
			item.kind === "header" ? (
				<SectionHeader title={item.title} />
			) : (
				<View style={{ paddingHorizontal: 16 }}>
					<NotificationCard notification={item.notification} onPress={handlePress} onDelete={handleDelete} />
				</View>
			),
		[handlePress, handleDelete],
	);

	const chip = (key: NotificationFilter, label: string) => {
		const active = filter === key;
		return (
			<TouchableOpacity
				key={key}
				onPress={() => changeFilter(key)}
				style={{
					paddingHorizontal: 16,
					paddingVertical: 7,
					borderRadius: 999,
					marginRight: 8,
					backgroundColor: active ? theme.colors.primary : "#F2F4F7",
				}}
			>
				<Text
					style={{
						fontFamily: theme.colors.fontSemiBold,
						fontSize: 13,
						color: active ? theme.colors.onPrimary : theme.colors.bodyColor,
					}}
				>
					{label}
				</Text>
			</TouchableOpacity>
		);
	};

	const footer = loadingMore ? (
		<ActivityIndicator style={{ marginVertical: 16 }} color={theme.colors.primary} />
	) : isError && rows.length > 0 ? (
		<View style={{ alignItems: "center", marginVertical: 12 }}>
			<Button mode="text" onPress={() => refetch()}>
				Couldn&apos;t load more. Tap to retry
			</Button>
		</View>
	) : null;

	let body: React.ReactElement;
	if (isLoading) {
		body = <LoadingSkeleton />;
	} else if (isError && !data) {
		body = (
			<EmptyState
				icon="cloud-alert"
				title="Couldn't load notifications"
				message="Check your connection and try again."
				actionLabel="Retry"
				onAction={() => refetch()}
			/>
		);
	} else {
		body = (
			<FlatList
				data={rows}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				onEndReached={handleEndReached}
				onEndReachedThreshold={0.4}
				ListFooterComponent={footer}
				ListEmptyComponent={
					<EmptyState
						icon={filter === "unread" ? "bell-check-outline" : "bell-outline"}
						title={filter === "unread" ? "You're all caught up" : "No notifications yet"}
						message={
							filter === "unread"
								? "You have no unread notifications."
								: "Updates about your bookings and payments will show up here."
						}
					/>
				}
				contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
				showsVerticalScrollIndicator={false}
				initialNumToRender={10}
				windowSize={9}
				removeClippedSubviews
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.colors.primary]} />
				}
			/>
		);
	}

	return (
		<View style={{ flex: 1 }}>
			<SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.primary }}>
				<StatusBar backgroundColor={theme.colors.primary} />
				<View className="flex flex-1">
					<View className="relative">
						<View className="flex flex-row justify-between items-center px-4 pt-6 pb-4">
							<TouchableOpacity className="flex-row items-center" onPress={() => navigation.goBack()}>
								<MaterialIcons name="chevron-left" size={30} color={theme.colors.onPrimary} />
								<Image source={logo} className="h-8 w-8 mr-2" />
								<Text
									variant="titleLarge"
									style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.onPrimary }}
								>
									Notifications
								</Text>
							</TouchableOpacity>
							<TouchableOpacity onPress={handleMarkAll} disabled={unreadCount === 0 || markingAll}>
								<Text
									style={{
										color: theme.colors.onPrimary,
										fontFamily: theme.colors.fontSemiBold,
										fontSize: 13,
										opacity: unreadCount === 0 ? 0.5 : 1,
									}}
								>
									Mark all read
								</Text>
							</TouchableOpacity>
						</View>
						<Image source={vector1} className="w-full absolute top-[-40px] left-[0px] -z-10" />
						<Image source={vector2} className="w-full h-[250px] absolute top-[20px] right-0 -z-10" />
					</View>

					<View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
						<View style={{ flexDirection: "row", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
							{chip("all", "All")}
							{chip("unread", unreadCount > 0 ? `Unread (${unreadCount})` : "Unread")}
						</View>
						{body}
					</View>

					<CustomSnackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>
						{snackbar}
					</CustomSnackbar>
				</View>
			</SafeAreaView>
		</View>
	);
};

export default NotificationsScreen;
