import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { useAppTheme } from "../utils/theme";

interface NotificationCardProps {
	notification: {
		_id: string;
		title: string;
		message: string;
		read: boolean;
		createdAt: string;
	};
	onPress: () => void;
}

const NotificationCard = ({ notification, onPress }: NotificationCardProps) => {
	const theme: any = useAppTheme();

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		const month = months[date.getMonth()];
		const day = date.getDate().toString().padStart(2, "0");
		const year = date.getFullYear();
		const hours = date.getHours() % 12 || 12;
		const minutes = date.getMinutes().toString().padStart(2, "0");
		const ampm = date.getHours() >= 12 ? "PM" : "AM";

		return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
	};

	return (
		<TouchableOpacity onPress={onPress}>
			<View
				className="p-4 mb-2 rounded-lg"
				style={{
					backgroundColor: notification.read ? theme.colors.surface : theme.colors.surfaceVariant,
				}}
			>
				<View className="flex-row justify-between items-start">
					<View className="flex-1">
						<Text
							variant="titleMedium"
							style={{
								fontFamily: theme.colors.fontSemiBold,
								color: theme.colors.onSurface,
							}}
						>
							{notification.title}
						</Text>
						<Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }} className="mt-1">
							{notification.message}
						</Text>
						<Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }} className="mt-2">
							{formatDate(notification.createdAt)}
						</Text>
					</View>
					{!notification.read && (
						<View className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
					)}
				</View>
			</View>
		</TouchableOpacity>
	);
};

export default NotificationCard;
