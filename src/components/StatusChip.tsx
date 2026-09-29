import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { DisplayStatus, STATUS_META } from "../utils/format";
import { useAppTheme } from "../utils/theme";

const StatusChip = ({ status }: { status: DisplayStatus }) => {
	const theme = useAppTheme();
	const meta = STATUS_META[status] ?? STATUS_META.scheduled;
	return (
		<View
			style={{ backgroundColor: meta.background, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}
		>
			<Text style={{ color: meta.color, fontFamily: theme.colors.fontSemiBold, fontSize: 12, lineHeight: 16 }}>
				{meta.label}
			</Text>
		</View>
	);
};

export default React.memo(StatusChip);
