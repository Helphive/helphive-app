import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { useAppTheme } from "../utils/theme";

const SectionHeader = ({ title }: { title: string }) => {
	const theme = useAppTheme();
	return (
		<View
			style={{
				paddingHorizontal: 16,
				paddingTop: 16,
				paddingBottom: 6,
				backgroundColor: theme.colors.background,
			}}
		>
			<Text
				style={{
					fontFamily: theme.colors.fontSemiBold,
					color: theme.colors.bodyColor,
					fontSize: 12,
					letterSpacing: 0.6,
					textTransform: "uppercase",
				}}
			>
				{title}
			</Text>
		</View>
	);
};

export default React.memo(SectionHeader);
