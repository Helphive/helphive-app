import React from "react";
import { View, ViewStyle } from "react-native";
import { Text } from "react-native-paper";
import { useAppTheme } from "../../utils/theme";
import { CARD_BORDER, TEXT_STRONG } from "./tokens";

type Props = { title?: string; children: React.ReactNode; style?: ViewStyle };

const InfoCard = ({ title, children, style }: Props) => {
	const theme = useAppTheme();
	return (
		<View
			style={[
				{
					backgroundColor: theme.colors.surface,
					borderRadius: 16,
					borderWidth: 1,
					borderColor: CARD_BORDER,
					padding: 16,
				},
				style,
			]}
		>
			{!!title && (
				<Text
					variant="titleSmall"
					style={{ fontFamily: theme.colors.fontBold, color: TEXT_STRONG, marginBottom: 12 }}
				>
					{title}
				</Text>
			)}
			{children}
		</View>
	);
};

export default InfoCard;
