import React, { useRef } from "react";
import { Alert, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { useAppTheme } from "../utils/theme";
import { formatTimeAgo } from "../utils/format";
import { getNotificationMeta } from "../utils/notifications";

export interface NotificationCardProps {
	notification: {
		_id: string;
		title: string;
		message: string;
		type?: string;
		read: boolean;
		createdAt: string;
	};
	onPress: (notification: any) => void;
	onDelete: (notification: any) => void;
}

const NotificationCard = ({ notification, onPress, onDelete }: NotificationCardProps) => {
	const theme = useAppTheme();
	const swipeRef = useRef<Swipeable>(null);
	const meta = getNotificationMeta(notification.type);

	const confirmDelete = () => {
		Alert.alert("Delete notification", "This notification will be removed.", [
			{ text: "Cancel", style: "cancel", onPress: () => swipeRef.current?.close() },
			{ text: "Delete", style: "destructive", onPress: () => onDelete(notification) },
		]);
	};

	const renderRightActions = () => (
		<TouchableOpacity
			onPress={() => onDelete(notification)}
			accessibilityLabel="Delete notification"
			style={{
				width: 84,
				marginBottom: 8,
				marginLeft: 8,
				borderRadius: 12,
				backgroundColor: "#B42318",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<MaterialCommunityIcons name="trash-can-outline" size={22} color="#fff" />
			<Text style={{ color: "#fff", fontFamily: theme.colors.fontMedium, fontSize: 12, marginTop: 2 }}>
				Delete
			</Text>
		</TouchableOpacity>
	);

	return (
		<Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false} friction={2}>
			<TouchableOpacity
				activeOpacity={0.8}
				onPress={() => onPress(notification)}
				onLongPress={confirmDelete}
				style={{
					flexDirection: "row",
					alignItems: "flex-start",
					padding: 14,
					marginBottom: 8,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: notification.read ? "#EAECF0" : theme.colors.primaryContainer,
					backgroundColor: notification.read ? theme.colors.surface : "#FFF8F6",
				}}
			>
				<View
					style={{
						width: 42,
						height: 42,
						borderRadius: 21,
						backgroundColor: meta.background,
						alignItems: "center",
						justifyContent: "center",
						marginRight: 12,
					}}
				>
					<MaterialCommunityIcons name={meta.icon as any} size={22} color={meta.color} />
				</View>
				<View style={{ flex: 1 }}>
					<View style={{ flexDirection: "row", alignItems: "center" }}>
						<Text
							numberOfLines={1}
							style={{
								flex: 1,
								fontFamily: theme.colors.fontBold,
								fontSize: 15,
								color: theme.colors.onBackground,
							}}
						>
							{notification.title}
						</Text>
						{!notification.read && (
							<View
								style={{
									width: 9,
									height: 9,
									borderRadius: 5,
									marginLeft: 8,
									backgroundColor: theme.colors.primary,
								}}
							/>
						)}
					</View>
					<Text
						numberOfLines={2}
						style={{
							marginTop: 2,
							fontSize: 13,
							lineHeight: 18,
							color: theme.colors.bodyColor,
							fontFamily: theme.colors.fontRegular,
						}}
					>
						{notification.message}
					</Text>
					<Text style={{ marginTop: 6, fontSize: 11, color: "#98A2B3", fontFamily: theme.colors.fontMedium }}>
						{formatTimeAgo(notification.createdAt)}
					</Text>
				</View>
			</TouchableOpacity>
		</Swipeable>
	);
};

export default React.memo(NotificationCard);
