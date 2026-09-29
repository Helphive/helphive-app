import React from "react";
import { Image, View } from "react-native";
import { Text } from "react-native-paper";
import { CARD_BORDER, TEXT_STRONG } from "../../../../../components/details/tokens";
import { formatDateTime, formatMoney } from "../../../../../utils/format";
import { useAppTheme } from "../../../../../utils/theme";

const visa = require("../../../../../../assets/icons/balance/visa.png");
const creditcard = require("../../../../../../assets/icons/balance/credit-card.png");
const mastercard = require("../../../../../../assets/icons/balance/master-card.png");
const paypal = require("../../../../../../assets/icons/balance/paypal.png");
const payoneer = require("../../../../../../assets/icons/balance/payoneer.png");
const bank = require("../../../../../../assets/icons/balance/link-with-bank.png");

const METHODS: { match: string; label: string; icon: any }[] = [
	{ match: "visa", label: "Visa", icon: visa },
	{ match: "mastercard", label: "Mastercard", icon: mastercard },
	{ match: "card", label: "Credit card", icon: creditcard },
	{ match: "paypal", label: "PayPal", icon: paypal },
	{ match: "payoneer", label: "Payoneer", icon: payoneer },
];

const method = (type: string = "") =>
	METHODS.find((m) => type.includes(m.match)) ?? { match: "", label: "Bank transfer", icon: bank };

const STATUS_TONE: Record<string, { color: string; background: string }> = {
	paid: { color: "#067647", background: "#ECFDF3" },
	pending: { color: "#B54708", background: "#FFFAEB" },
};
const FAILED_TONE = { color: "#B42318", background: "#FEF3F2" };

const PayoutRow = ({ payout }: { payout: any }) => {
	const theme = useAppTheme();
	const { label, icon } = method(payout.destinationDetails?.type);
	const tone = STATUS_TONE[payout.status] ?? FAILED_TONE;
	const outgoing = payout.status === "paid" || payout.status === "pending";

	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				paddingVertical: 12,
				borderBottomWidth: 1,
				borderBottomColor: CARD_BORDER,
			}}
		>
			<Image source={icon} style={{ width: 40, height: 40 }} resizeMode="contain" />
			<View style={{ flex: 1, marginLeft: 12 }}>
				<Text style={{ fontFamily: theme.colors.fontSemiBold, color: TEXT_STRONG }}>
					{label} {payout.destinationDetails?.last4 ? `**** ${payout.destinationDetails.last4}` : ""}
				</Text>
				<Text style={{ fontSize: 12, color: theme.colors.bodyColor }}>{formatDateTime(payout.createdAt)}</Text>
			</View>
			<View style={{ alignItems: "flex-end", gap: 4 }}>
				<Text style={{ fontFamily: theme.colors.fontSemiBold, color: TEXT_STRONG }}>
					{outgoing ? "-" : "+"}
					{formatMoney(payout.amount, payout.currency ?? "usd")}
				</Text>
				<View
					style={{
						backgroundColor: tone.background,
						borderRadius: 999,
						paddingHorizontal: 8,
						paddingVertical: 2,
					}}
				>
					<Text
						style={{
							color: tone.color,
							fontFamily: theme.colors.fontSemiBold,
							fontSize: 11,
							textTransform: "capitalize",
						}}
					>
						{payout.status}
					</Text>
				</View>
			</View>
		</View>
	);
};

export default React.memo(PayoutRow);
