import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { useAppTheme } from "../../utils/theme";
import { formatMoney } from "../../utils/format";
import { CARD_BORDER, TEXT_STRONG } from "./tokens";

export type PriceLine = { label: string; value: string; muted?: boolean; positive?: boolean };

type Props = { lines: PriceLine[]; totalLabel: string; total: number; currency?: string; totalNote?: string };

const PriceBreakdown = ({ lines, totalLabel, total, currency = "usd", totalNote }: Props) => {
	const theme = useAppTheme();
	return (
		<View>
			{lines.map((line) => (
				<View
					key={line.label}
					style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}
				>
					<Text style={{ color: theme.colors.bodyColor, fontFamily: theme.colors.fontRegular }}>
						{line.label}
					</Text>
					<Text
						style={{
							color: line.positive ? "#067647" : line.muted ? theme.colors.bodyColor : TEXT_STRONG,
							fontFamily: theme.colors.fontMedium,
						}}
					>
						{line.value}
					</Text>
				</View>
			))}
			<View style={{ height: 1, backgroundColor: CARD_BORDER, marginVertical: 8 }} />
			<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
				<View style={{ flex: 1 }}>
					<Text style={{ fontFamily: theme.colors.fontBold, color: TEXT_STRONG, fontSize: 16 }}>
						{totalLabel}
					</Text>
					{!!totalNote && <Text style={{ fontSize: 12, color: theme.colors.bodyColor }}>{totalNote}</Text>}
				</View>
				<Text style={{ fontFamily: theme.colors.fontBold, color: TEXT_STRONG, fontSize: 20 }}>
					{formatMoney(total, currency)}
				</Text>
			</View>
		</View>
	);
};

export default PriceBreakdown;
