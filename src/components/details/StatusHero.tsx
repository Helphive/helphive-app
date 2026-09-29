import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import StatusChip from "../StatusChip";
import { DisplayStatus, formatDateTime } from "../../utils/format";
import { useAppTheme } from "../../utils/theme";
import { TEXT_STRONG } from "./tokens";

type Props = { status: DisplayStatus; title: string; date?: string | null; reference?: string };

const StatusHero = ({ status, title, date, reference }: Props) => {
	const theme = useAppTheme();
	return (
		<View style={{ paddingVertical: 4 }}>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: 10,
				}}
			>
				<StatusChip status={status} />
				{!!reference && (
					<Text style={{ color: theme.colors.bodyColor, fontFamily: theme.colors.fontMedium }}>
						{reference}
					</Text>
				)}
			</View>
			<Text style={{ fontFamily: theme.colors.fontBold, fontSize: 24, lineHeight: 30, color: TEXT_STRONG }}>
				{title}
			</Text>
			{!!date && (
				<Text style={{ color: theme.colors.bodyColor, marginTop: 4, fontSize: 14 }}>
					{formatDateTime(date)}
				</Text>
			)}
		</View>
	);
};

export default StatusHero;
