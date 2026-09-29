import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { useAppTheme } from "../utils/theme";

/** Small count badge, absolutely positioned at the top-right of its (relatively positioned) parent. */
const NotificationBadge = ({ count }: { count: number }) => {
	const theme = useAppTheme();
	if (count <= 0) return null;
	return (
		<View
			pointerEvents="none"
			style={{
				position: "absolute",
				top: -5,
				right: -6,
				minWidth: 18,
				height: 18,
				paddingHorizontal: 4,
				borderRadius: 9,
				backgroundColor: "#FFFFFF",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Text
				style={{ color: theme.colors.primary, fontFamily: theme.colors.fontBold, fontSize: 10, lineHeight: 13 }}
			>
				{count > 99 ? "99+" : count}
			</Text>
		</View>
	);
};

export default React.memo(NotificationBadge);
