import React from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import InfoCard from "../../../../../components/details/InfoCard";
import { TEXT_STRONG } from "../../../../../components/details/tokens";
import { formatMoney } from "../../../../../utils/format";
import { useAppTheme } from "../../../../../utils/theme";

type Props = {
	balance: number;
	canWithdraw: boolean;
	onWithdraw: () => void;
	onWithdrawMethods: () => void;
	onDashboard: () => void;
	onEarnings: () => void;
};

const BalanceCard = ({ balance, canWithdraw, onWithdraw, onWithdrawMethods, onDashboard, onEarnings }: Props) => {
	const theme = useAppTheme();
	return (
		<InfoCard>
			<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
				<Text style={{ fontFamily: theme.colors.fontMedium, color: theme.colors.bodyColor }}>
					Available balance
				</Text>
				<Button
					compact
					mode="text"
					onPress={onWithdrawMethods}
					labelStyle={{ fontFamily: theme.colors.fontMedium, marginHorizontal: 4 }}
				>
					Withdraw methods
				</Button>
			</View>
			<Text style={{ fontFamily: theme.colors.fontBold, fontSize: 34, lineHeight: 42, color: TEXT_STRONG }}>
				{formatMoney(balance)}
			</Text>
			<View style={{ gap: 8, marginTop: 12 }}>
				<Button
					mode="contained"
					icon="bank-transfer-out"
					onPress={onWithdraw}
					disabled={!canWithdraw}
					contentStyle={{ paddingVertical: 4 }}
					labelStyle={{ fontFamily: theme.colors.fontBold }}
				>
					Withdraw
				</Button>
				<View style={{ flexDirection: "row", gap: 8 }}>
					<Button
						mode="outlined"
						icon="open-in-new"
						onPress={onDashboard}
						disabled={!canWithdraw}
						style={{ flex: 1 }}
						labelStyle={{ fontFamily: theme.colors.fontSemiBold, fontSize: 13 }}
					>
						Payments
					</Button>
					<Button
						mode="outlined"
						icon="clock-outline"
						onPress={onEarnings}
						style={{ flex: 1 }}
						labelStyle={{ fontFamily: theme.colors.fontSemiBold, fontSize: 13 }}
					>
						Upcoming
					</Button>
				</View>
			</View>
			{!canWithdraw && (
				<Text style={{ marginTop: 12, fontSize: 12, color: theme.colors.bodyColor }}>
					Add a withdraw method to enable payouts.
				</Text>
			)}
		</InfoCard>
	);
};

export default BalanceCard;
