import React, { useEffect, useState } from "react";
import { BottomSheet, Button, Text, TextField } from "@/ui";
import { formatMoney } from "@/lib/format";

export const MIN_PAYOUT = 20;

/** Whole dollars, at least $20, at most the available balance. Returns the error to show, or null. */
export const payoutError = (amount: string, available: number): string | null => {
	if (!/^\d+$/.test(amount)) return "Enter a whole-dollar amount, for example 50.";
	const n = Number(amount);
	if (n < MIN_PAYOUT) return `Withdraw at least ${formatMoney(MIN_PAYOUT)}.`;
	if (n > available) return `You can withdraw up to ${formatMoney(available)}.`;
	return null;
};

type Props = {
	visible: boolean;
	available: number;
	loading: boolean;
	onSubmit: (amount: number) => void;
	onClose: () => void;
};

/** Ask how much to withdraw. Validates on submit, then as the provider types. */
export default function PayoutDialog({ visible, available, loading, onSubmit, onClose }: Props) {
	const [amount, setAmount] = useState("");
	const [submitted, setSubmitted] = useState(false);
	useEffect(() => {
		if (visible) {
			setAmount("");
			setSubmitted(false);
		}
	}, [visible]);
	const error = submitted ? payoutError(amount, available) : null;

	const submit = () => {
		setSubmitted(true);
		if (!payoutError(amount, available)) onSubmit(Number(amount));
	};

	return (
		<BottomSheet
			visible={visible}
			onClose={loading ? () => undefined : onClose}
			title="Withdraw to your bank"
			footer={
				<>
					<Button variant="secondary" onPress={onClose} disabled={loading} style={{ flex: 1 }}>
						Cancel
					</Button>
					<Button onPress={submit} loading={loading} style={{ flex: 1 }}>
						Request payout
					</Button>
				</>
			}
		>
			<Text variant="ui" color="ink600">
				{`Available: ${formatMoney(available)}. Payouts go to the bank account set up in Stripe.`}
			</Text>
			<TextField
				label="Amount in USD"
				required
				value={amount}
				onChangeText={(t) => setAmount(t.replace(/[^\d]/g, ""))}
				keyboardType="number-pad"
				placeholder={`At least ${MIN_PAYOUT}`}
				error={error ?? undefined}
				hint={error ? undefined : `Minimum ${formatMoney(MIN_PAYOUT)}, whole dollars`}
			/>
		</BottomSheet>
	);
}
