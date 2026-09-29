import React, { useRef, useEffect, useCallback, useState } from "react";
import { FlatList, Image, RefreshControl, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import withAuthCheck from "../../../../hocs/withAuthCheck";
import { useAppTheme } from "../../../../utils/theme";
import {
	useGetEarningsQuery,
	useStripeConnectOnboardingQuery,
	useCreatePayoutMutation,
	useGetStripeExpressLoginLinkQuery,
} from "../../../../features/provider/providerApiSlice";
import { RootStackParamList } from "../../../../utils/CustomTypes";
import CustomSnackbar from "../../../../components/CustomSnackbar";
import EmptyState from "../../../../components/EmptyState";
import Skeleton from "../../../../components/Skeleton";
import { PAGE_BACKGROUND, SCREEN_PADDING, TEXT_STRONG } from "../../../../components/details/tokens";
import BalanceCard from "./components/BalanceCard";
import PayoutDialog, { isValidPayoutAmount } from "./components/PayoutDialog";
import PayoutRow from "./components/PayoutRow";

const logo = require("../../../../../assets/Logo/logo-light.png");

const errorText = (error: any, fallback: string) =>
	(typeof error?.data === "string" ? error.data : error?.data?.message) || error?.message || fallback;

const Balance = ({ userDetails }: { userDetails: any }) => {
	const theme = useAppTheme();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const listRef = useRef<FlatList>(null);
	const [snackbarMessage, setSnackbarMessage] = useState("");
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [dialogVisible, setDialogVisible] = useState(false);
	const [payoutAmount, setPayoutAmount] = useState("");

	const { refetch: refetchOnboarding } = useStripeConnectOnboardingQuery();
	const {
		data: earningsData,
		error: earningsError,
		isLoading: earningsLoading,
		refetch: refetchEarnings,
	} = useGetEarningsQuery();
	const [createPayout, { isLoading: isCreatingPayout }] = useCreatePayoutMutation();
	const { refetch: refetchStripeExpressLoginLink } = useGetStripeExpressLoginLinkQuery();

	const canWithdraw = !!userDetails?.user?.stripeConnectedAccountId;

	const refresh = useCallback(async () => {
		setIsRefreshing(true);
		try {
			await refetchEarnings();
		} finally {
			setIsRefreshing(false);
		}
		listRef.current?.scrollToOffset({ offset: 0, animated: true });
	}, [refetchEarnings]);

	useFocusEffect(
		useCallback(() => {
			refetchEarnings();
			listRef.current?.scrollToOffset({ offset: 0, animated: true });
		}, [refetchEarnings]),
	);

	useEffect(() => {
		if (earningsError) setSnackbarMessage("Could not load your earnings. Pull down to try again.");
	}, [earningsError]);

	useEffect(() => {
		let inProgress = false;
		const unsubscribe = navigation.addListener("tabPress" as never, async () => {
			if (inProgress) return;
			inProgress = true;
			await refresh();
			inProgress = false;
		});
		return unsubscribe;
	}, [navigation, refresh]);

	const openWebView = (url: string, title: string) => {
		try {
			navigation.navigate("WebView", { url, title });
		} catch (err) {
			console.error("Failed to navigate to WebViewScreen:", err);
			setSnackbarMessage("Could not open the page. Please try again.");
		}
	};

	const handleAddBankAccount = async () => {
		const result = await refetchOnboarding();
		if (result.isLoading) return;
		if (result.error) {
			console.error("Error fetching account link:", result.error);
			setSnackbarMessage("Error fetching account link: " + errorText(result.error, "Please try again."));
			return;
		}
		if (result.data?.connectedAccountOnboardingLink) {
			openWebView(result.data.connectedAccountOnboardingLink, "Add Bank Account");
		}
	};

	const handleViewStripeDashboard = async () => {
		const result = await refetchStripeExpressLoginLink();
		if (result.isLoading) return;
		if (result.error) {
			console.error("Error fetching stripe express login link:", result.error);
			setSnackbarMessage("Error opening the payments dashboard: " + errorText(result.error, "Please try again."));
			return;
		}
		if (result.data?.loginLink) openWebView(result.data.loginLink.url, "Stripe Dashboard");
	};

	const confirmPayout = async () => {
		if (!isValidPayoutAmount(payoutAmount)) return;
		try {
			const result = await createPayout({ amount: parseFloat(payoutAmount) }).unwrap();
			if (result) {
				setDialogVisible(false);
				setPayoutAmount("");
				setIsRefreshing(true);
				await refetchEarnings();
				await refetchOnboarding();
				setIsRefreshing(false);
				setSnackbarMessage("Payout created successfully");
			}
		} catch (error) {
			console.log(error);
			setDialogVisible(false);
			setSnackbarMessage("Error creating payout: " + errorText(error, "Please try again."));
		}
	};

	const payouts: any[] = earningsData?.payouts ?? [];

	const header = (
		<View style={{ gap: 16, paddingBottom: 8 }}>
			<BalanceCard
				balance={earningsData?.availableBalance || 0}
				canWithdraw={canWithdraw}
				onWithdraw={() => setDialogVisible(true)}
				onWithdrawMethods={handleAddBankAccount}
				onDashboard={handleViewStripeDashboard}
				onEarnings={() => navigation.navigate("Earnings")}
			/>
			<Text style={{ fontFamily: theme.colors.fontBold, fontSize: 18, color: TEXT_STRONG }}>Payout history</Text>
		</View>
	);

	return (
		<SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.colors.primary }}>
			<StatusBar style="light" backgroundColor={theme.colors.primary} />
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					minHeight: 56,
					paddingHorizontal: SCREEN_PADDING,
					gap: 8,
				}}
			>
				<Image source={logo} style={{ height: 28, width: 28 }} />
				<Text
					variant="titleLarge"
					style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.onPrimary }}
				>
					Balance
				</Text>
			</View>
			<FlatList
				ref={listRef}
				style={{ flex: 1, backgroundColor: PAGE_BACKGROUND }}
				contentContainerStyle={{ padding: SCREEN_PADDING, flexGrow: 1 }}
				data={payouts}
				keyExtractor={(item, index) => String(item._id ?? index)}
				renderItem={({ item }) => <PayoutRow payout={item} />}
				ListHeaderComponent={header}
				ListEmptyComponent={
					earningsLoading ? (
						<View style={{ gap: 12 }}>
							<Skeleton width="100%" height={56} />
							<Skeleton width="100%" height={56} />
							<Skeleton width="100%" height={56} />
						</View>
					) : (
						<EmptyState
							icon="cash-multiple"
							title="No payouts yet"
							message="Your payouts will appear here after you withdraw."
						/>
					)
				}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				refreshControl={
					<RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[theme.colors.primary]} />
				}
			/>
			<PayoutDialog
				visible={dialogVisible}
				amount={payoutAmount}
				loading={isCreatingPayout}
				onChange={setPayoutAmount}
				onConfirm={confirmPayout}
				onDismiss={() => setDialogVisible(false)}
			/>
			<CustomSnackbar visible={!!snackbarMessage} onDismiss={() => setSnackbarMessage("")} duration={3000}>
				{snackbarMessage}
			</CustomSnackbar>
		</SafeAreaView>
	);
};

export default withAuthCheck(Balance);
