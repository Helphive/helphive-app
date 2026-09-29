import React from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "../utils/theme";

interface EmptyStateProps {
	icon: keyof typeof MaterialCommunityIcons.glyphMap;
	title: string;
	message?: string;
	actionLabel?: string;
	onAction?: () => void;
}

const EmptyState = ({ icon, title, message, actionLabel, onAction }: EmptyStateProps) => {
	const theme = useAppTheme();
	return (
		<View style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingVertical: 48 }}>
			<View
				style={{
					width: 88,
					height: 88,
					borderRadius: 44,
					backgroundColor: theme.colors.primaryContainer,
					alignItems: "center",
					justifyContent: "center",
					marginBottom: 20,
				}}
			>
				<MaterialCommunityIcons name={icon} size={40} color={theme.colors.primary} />
			</View>
			<Text
				variant="titleMedium"
				style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.onBackground, textAlign: "center" }}
			>
				{title}
			</Text>
			{!!message && (
				<Text
					variant="bodyMedium"
					style={{
						color: theme.colors.bodyColor,
						textAlign: "center",
						marginTop: 6,
						fontFamily: theme.colors.fontRegular,
					}}
				>
					{message}
				</Text>
			)}
			{!!actionLabel && !!onAction && (
				<Button
					mode="contained"
					onPress={onAction}
					style={{ marginTop: 20 }}
					labelStyle={{ fontFamily: theme.colors.fontSemiBold }}
				>
					{actionLabel}
				</Button>
			)}
		</View>
	);
};

export default EmptyState;
