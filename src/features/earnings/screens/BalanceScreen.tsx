import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
	Button,
	EmptyState,
	ErrorState,
	ListRow,
	ListSkeleton,
	Notice,
	PageTitle,
	Panel,
	Screen,
	StatusPill,
	Text,
	space,
	useToast,
} from "@/ui";
import { EarningsIcon, PayoutIcon, ReceiptIcon } from "@/ui/icons";
import { getErrorMessage } from "@/services/api/errors";
import { useAuthCheck } from "@/features/auth/useAuthCheck";
import {
	useCreatePayoutMutation,
	useLazyGetStripeExpressLoginLinkQuery,
	useLazyStripeConnectOnboardingQuery,
} from "@/features/provider/api";
import BalanceCard from "../components/BalanceCard";
import PayoutDialog from "../components/PayoutDialog";
import PayoutRow from "../components/PayoutRow";
import { useEarnings } from "../useEarnings";

/** Earnings tab: balance and withdraw, the Stripe payout account, payout history. */
export default function BalanceScreen() {
	const navigation = useNavigation();
	const toast = useToast();
	const { userDetails } = useAuthCheck();
	const e = useEarnings();
	const [payoutOpen, setPayoutOpen] = useState(false);
	const [createPayout, { isLoading: paying }] = useCreatePayoutMutation();
	const [getOnboardingLink, onboarding] = useLazyStripeConnectOnboardingQuery();
	const [getLoginLink, login] = useLazyGetStripeExpressLoginLinkQuery();
	const stripeConnected = !!userDetails?.user?.stripeConnectedAccountId;

	const { refetch } = e;
	useFocusEffect(
		useCallback(() => {
			refetch();
		}, [refetch]),
	);

	const openSetup = async () => {
		try {
			const { connectedAccountOnboardingLink } = await getOnboardingLink().unwrap();
			navigation.navigate("WebView", { url: connectedAccountOnboardingLink, title: "Set up payouts" });
		} catch (err) {
			toast.error(getErrorMessage(err, "Could not open Stripe payout setup. Try again in a moment."));
		}
	};
	const openDashboard = async () => {
		try {
			const { loginLink } = await getLoginLink().unwrap();
			navigation.navigate("WebView", { url: loginLink.url, title: "Stripe dashboard" });
		} catch (err) {
			toast.error(getErrorMessage(err, "Could not open the Stripe dashboard. Try again in a moment."));
		}
	};
	const requestPayout = async (amount: number) => {
		try {
			await createPayout({ amount }).unwrap();
			setPayoutOpen(false);
			toast.success("Payout requested");
		} catch (err) {
			toast.error(getErrorMessage(err, "Could not request the payout. Try again."));
		}
	};

	return (
		<Screen inTabs refreshing={e.isFetching && !e.isLoading} onRefresh={e.refetch}>
			<PageTitle title="Earnings" subtitle="Track your income and withdraw it to your bank account" />
			{e.notice ? <Notice tone="info">{e.notice}</Notice> : null}

			{e.failed ? (
				<ErrorState
					title="Could not load your earnings"
					message={getErrorMessage(e.error, "Check your connection and try again.")}
					onRetry={e.refetch}
					retrying={e.isFetching}
				/>
			) : (
				<BalanceCard
					loading={e.isLoading}
					available={e.available}
					pending={e.pending}
					total={e.total}
					canWithdraw={stripeConnected}
					onWithdraw={() => setPayoutOpen(true)}
				/>
			)}

			<Panel
				title="Payout account"
				subtitle="Payouts are handled by Stripe, our payments partner."
				actions={
					<StatusPill tone={stripeConnected ? "green" : "amber"}>
						{stripeConnected ? "Connected" : "Not set up"}
					</StatusPill>
				}
			>
				<View style={styles.stripe}>
					<Text variant="ui" color="ink600">
						{stripeConnected
							? "Update your bank and identity details, or see transfers and payouts in Stripe."
							: "Add the bank account and identity details Stripe needs to pay you. You need this to withdraw."}
					</Text>
					<Button
						variant={stripeConnected ? "secondary" : "ink"}
						icon={PayoutIcon}
						loading={onboarding.isFetching}
						onPress={openSetup}
					>
						{stripeConnected ? "Update payout details" : "Set up payouts"}
					</Button>
					{stripeConnected ? (
						<Button variant="secondary" loading={login.isFetching} onPress={openDashboard}>
							Open Stripe dashboard
						</Button>
					) : null}
				</View>
			</Panel>

			{e.failed ? null : (
				<>
					<Panel flush>
						<ListRow
							first
							title="Earnings history"
							subtitle="Each completed job, with its receipt"
							left={<ReceiptIcon />}
							onPress={() => navigation.navigate("Earnings")}
						/>
					</Panel>
					{e.isLoading ? (
						<ListSkeleton rows={3} />
					) : (
						<Panel title="Payout history" flush>
							{e.payouts.length ? (
								e.payouts.map((p, i) => <PayoutRow key={p._id} payout={p} first={i === 0} />)
							) : (
								<EmptyState
									bare
									icon={EarningsIcon}
									title="No payouts yet"
									description="Payouts you request appear here with their status."
								/>
							)}
						</Panel>
					)}
				</>
			)}

			<PayoutDialog
				visible={payoutOpen}
				available={e.available}
				loading={paying}
				onSubmit={requestPayout}
				onClose={() => setPayoutOpen(false)}
			/>
		</Screen>
	);
}

const styles = StyleSheet.create({
	stripe: { gap: space[3] },
});
