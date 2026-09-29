import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "../../utils/theme";
import { TEXT_STRONG } from "./tokens";

type Props = {
	icon: keyof typeof MaterialCommunityIcons.glyphMap;
	label: string;
	value?: string | null;
	children?: React.ReactNode;
};

const InfoRow = ({ icon, label, value, children }: Props) => {
	const theme = useAppTheme();
	return (
		<View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 8 }}>
			<View
				style={{
					width: 36,
					height: 36,
					borderRadius: 10,
					backgroundColor: theme.colors.primaryContainer,
					alignItems: "center",
					justifyContent: "center",
					marginRight: 12,
				}}
			>
				<MaterialCommunityIcons name={icon} size={20} color={theme.colors.primary} />
			</View>
			<View style={{ flex: 1 }}>
				<Text style={{ fontSize: 12, color: theme.colors.bodyColor, fontFamily: theme.colors.fontRegular }}>
					{label}
				</Text>
				{children ?? (
					<Text
						style={{ fontSize: 15, color: TEXT_STRONG, fontFamily: theme.colors.fontMedium, marginTop: 1 }}
					>
						{value || "—"}
					</Text>
				)}
			</View>
		</View>
	);
};

export default InfoRow;
