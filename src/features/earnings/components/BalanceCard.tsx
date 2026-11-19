import React from "react";
import { Button, Skeleton, StatGroup, StatTile, Text } from "@/ui";
import { formatMoney } from "@/lib/format";

interface Props {
	loading: boolean;
	available: number;
	pending: number;
	total: number;
	/** Withdrawing needs a balance and a Stripe payout account. */
	canWithdraw: boolean;
	onWithdraw: () => void;
}

const figure = (loading: boolean, amount: number) =>
	loading ? <Skeleton width={110} height={26} /> : <Text variant="figure">{formatMoney(amount)}</Text>;

/** Available, pending and total earnings as one hairline group, the available balance featured with Withdraw. */
export default function BalanceCard({ loading, available, pending, total, canWithdraw, onWithdraw }: Props) {
	return (
		<StatGroup columns={2}>
			<StatTile
				featured
				label="Available balance"
				value={figure(loading, available)}
				hint={available > 0 ? "Ready to withdraw" : "Available after jobs are completed"}
				action={
					loading ? undefined : (
						<Button size="sm" onPress={onWithdraw} disabled={!canWithdraw || available <= 0}>
							Withdraw
						</Button>
					)
				}
			/>
			<StatTile label="Pending balance" value={figure(loading, pending)} hint="Released after completion" />
			<StatTile label="Total earnings" value={figure(loading, total)} hint="All completed jobs" />
		</StatGroup>
	);
}
