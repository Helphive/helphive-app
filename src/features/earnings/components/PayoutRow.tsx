import React, { memo } from "react";
import { View } from "react-native";
import dayjs from "dayjs";
import { StatusPill, Text, space, type Tone, makeStyles, useTheme } from "@/ui";
import { PayoutIcon } from "@/ui/icons";
import { formatMoney } from "@/lib/format";
import type { Payout } from "@/features/orders/types";

const STATUS: Record<Payout["status"], { label: string; tone: Tone }> = {
	pending: { label: "Pending", tone: "amber" },
	in_transit: { label: "In transit", tone: "blue" },
	paid: { label: "Paid", tone: "green" },
	failed: { label: "Failed", tone: "red" },
	cancelled: { label: "Cancelled", tone: "grey" },
};

const destination = (p: Payout) => {
	const kind = p.destinationDetails?.type === "card" ? "Card" : "Bank account";
	return p.destinationDetails?.last4 ? `${kind} ending ${p.destinationDetails.last4}` : kind;
};

/** One payout: where it went, when, how much, and its status. */
function PayoutRow({ payout, first }: { payout: Payout; first?: boolean }) {
	const { color } = useTheme();
	const styles = useStyles();
	const status = STATUS[payout.status] ?? STATUS.pending;
	return (
		<View style={[styles.row, !first && styles.line]}>
			<PayoutIcon color={color.ink500} />
			<View style={styles.body}>
				<Text variant="uiStrong" numberOfLines={1}>
					{destination(payout)}
				</Text>
				<Text variant="small">{dayjs(payout.createdAt).format("D MMM YYYY")}</Text>
			</View>
			<View style={styles.right}>
				<Text variant="uiStrong" weight="bold">
					{formatMoney(payout.amount, payout.currency ?? "usd")}
				</Text>
				<StatusPill tone={status.tone}>{status.label}</StatusPill>
			</View>
		</View>
	);
}

export default memo(PayoutRow);

const useStyles = makeStyles(({ color }) => ({
	row: { flexDirection: "row", alignItems: "center", gap: space[3], padding: space[4] },
	line: { borderTopWidth: 1, borderTopColor: color.line },
	body: { flex: 1, gap: 2 },
	right: { alignItems: "flex-end", gap: 4 },
}));
