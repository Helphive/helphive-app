import React, { useRef, useEffect, useCallback, useState } from "react";
import { Image, ScrollView, TouchableOpacity, View, RefreshControl } from "react-native";
import { Button, Text, Dialog, Portal, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import withAuthCheck from "../../../../hocs/withAuthCheck";
import { useAppTheme } from "../../../../utils/theme";
import { StatusBar } from "expo-status-bar";
import {
	useGetEarningsQuery,
	useStripeConnectOnboardingQuery,
	useCreatePayoutMutation,
	useGetStripeExpressLoginLinkQuery,
} from "../../../../features/provider/providerApiSlice";

import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../../../utils/CustomTypes";
import { StackNavigationProp } from "@react-navigation/stack";
import CustomSnackbar from "../../../../components/CustomSnackbar";

const vector1 = require("../../../../../assets/cloud vectors/vector-1.png");
const vector2 = require("../../../../../assets/cloud vectors/vector-2.png");
const logo = require("../../../../../assets/Logo/logo-light.png");

const visa = require("../../../../../assets/icons/balance/visa.png");
const creditcard = require("../../../../../assets/icons/balance/credit-card.png");
const mastercard = require("../../../../../assets/icons/balance/master-card.png");
const paypal = require("../../../../../assets/icons/balance/paypal.png");
const payoneer = require("../../../../../assets/icons/balance/payoneer.png");
const bank = require("../../../../../assets/icons/balance/link-with-bank.png");

const Balance = ({ userDetails }: { userDetails: any }) => {
	const theme = useAppTheme();
	const [snackbarVisible, setSnackbarVisible] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState("");
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [dialogVisible, setDialogVisible] = useState(false);
	const [payoutAmount, setPayoutAmount] = useState("");
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

	const scrollViewRef = useRef<ScrollView>(null);

	const { refetch: refetchOnboarding } = useStripeConnectOnboardingQuery();
	const {
		data: earningsData,
		error: earningsError,
		isLoading: earningsLoading,
		refetch: refetchEarnings,
	} = useGetEarningsQuery();

	const [createPayout, { isLoading: isCreatingPayout }] = useCreatePayoutMutation();

	const { refetch: refetchStripeExpressLoginLink } = useGetStripeExpressLoginLinkQuery();

	useFocusEffect(
		useCallback(() => {
			refetchEarnings();
			scrollViewRef.current?.scrollTo({ y: 0, animated: true });
		}, [refetchEarnings]),
	);

	useEffect(() => {
		if (earningsError) {
			setSnackbarMessage("Error fetching earnings: " + earningsError);
			setSnackbarVisible(true);
		}
	}, [earningsError]);

	useEffect(() => {
		let isTabPressInProgress = false;

		const unsubscribe = navigation.addListener("tabPress" as never, async (_e: any) => {
			if (isTabPressInProgress) return;
			isTabPressInProgress = true;
			setIsRefreshing(true);
			await refetchEarnings();
			scrollViewRef.current?.scrollTo({ y: 0, animated: true });
			setIsRefreshing(false);
			isTabPressInProgress = false;
		});

		return unsubscribe;
	}, [navigation, refetchEarnings]);

	const handleAddBankAccount = async () => {
		const result = await refetchOnboarding();

		if (result.isLoading) {
			console.log("Loading account link...");
			return;
		}

		if (result.error) {
			console.error("Error fetching account link:", result.error);
			const errorMessage = "status" in result.error ? result.error.data : result.error.message;
			setSnackbarMessage("Error fetching account link: " + errorMessage);
			setSnackbarVisible(true);
			return;
		}

		if (result.data && result.data.connectedAccountOnboardingLink) {
			const accountLink = result.data.connectedAccountOnboardingLink;
			try {
				navigation.navigate("WebView", { url: accountLink, title: "Add Bank Account" });
			} catch (err) {
				console.error("Failed to navigate to WebViewScreen:", err);
				setSnackbarMessage("Failed to navigate to WebViewScreen: " + err);
				setSnackbarVisible(true);
			}
		}
	};

	const handleCreatePayout = async () => {
		setDialogVisible(true);
	};

	const confirmPayout = async () => {
		if (Number(payoutAmount) < 20 || !Number.isInteger(Number(payoutAmount)) || !/^\d+$/.test(payoutAmount)) {
			return;
		}
		try {
			const result = await createPayout({ amount: parseFloat(payoutAmount) }).unwrap();
			if (result) {
				setSnackbarVisible(false);
				setDialogVisible(false);
				setIsRefreshing(true);
				await refetchEarnings();
				await refetchOnboarding();
				setSnackbarMessage("Payout created successfully");
				setSnackbarVisible(true);
				setPayoutAmount("");
				setIsRefreshing(false);
			}
		} catch (error) {
			setDialogVisible(false);
			console.log(error);
			const errorMessage = (error as any).data.message ? (error as any).data.message : (error as any).data;
			setSnackbarMessage("Error creating payout: " + errorMessage);
			setSnackbarVisible(true);
		}
	};

	const getPayoutIcon = (destinationAccount: string) => {
		if (destinationAccount.includes("visa")) {
			return visa;
		}
		if (destinationAccount.includes("mastercard")) {
			return mastercard;
		}
		if (destinationAccount.includes("card")) {
			return creditcard;
		}
		if (destinationAccount.includes("paypal")) {
			return paypal;
		}
		if (destinationAccount.includes("payoneer")) {
			return payoneer;
		}
		return bank;
	};

	const getPayoutType = (destinationAccount: string) => {
		if (destinationAccount.includes("visa")) {
			return "Visa";
		}
		if (destinationAccount.includes("mastercard")) {
			return "Mastercard";
		}
		if (destinationAccount.includes("card")) {
			return "Credit Card";
		}
		if (destinationAccount.includes("paypal")) {
			return "PayPal";
		}
		if (destinationAccount.includes("payoneer")) {
			return "Payoneer";
		}
		return "Bank Transfer";
	};

	const handleViewStripeDashboard = async () => {
		const result = await refetchStripeExpressLoginLink();

		if (result.isLoading) {
			console.log("Loading stripe express login link...");
			return;
		}

		if (result.error) {
			console.error("Error fetching stripe express login link:", result.error);
			setSnackbarMessage("Error fetching stripe express login link: " + result.error);
			setSnackbarVisible(true);
			return;
		}

		if (result.data && result.data.loginLink) {
			const stripeExpressLoginLink = result.data.loginLink.url;

			try {
				navigation.navigate("WebView", { url: stripeExpressLoginLink, title: "Stripe Dashboard" });
			} catch (err) {
				console.error("Failed to navigate to WebViewScreen:", err);
				setSnackbarMessage("Failed to navigate to WebViewScreen: " + err);
				setSnackbarVisible(true);
			}
		}
	};

	const handleViewEarningDetails = () => {
		navigation.navigate("Earnings");
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary }}>
			<StatusBar backgroundColor={theme.colors.primary} />

			<View style={{ flex: 1 }}>
				<View style={{ position: "relative" }}>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
							paddingHorizontal: 16,
							paddingTop: 24,
							paddingBottom: 16,
						}}
					>
						<View className="flex flex-row justify-between items-center gap-2 min-h-[40px] w-full">
							<View className="flex-row justify-start">
								<Image source={logo} className="h-8 w-8 mr-2" />
								<Text
									variant="titleLarge"
									style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.onPrimary }}
									className="text-left"
								>
									Balance
								</Text>
							</View>
						</View>
					</View>
					<Image
						source={vector1}
						style={{ width: "100%", position: "absolute", top: -40, left: 0, zIndex: -10 }}
					/>
					<Image
						source={vector2}
						style={{ width: "100%", height: 250, position: "absolute", top: 20, right: 0, zIndex: -10 }}
					/>
				</View>
				<View
					style={{
						position: "absolute",
						top: "20%",
						bottom: 0,
						left: 0,
						right: 0,
						backgroundColor: "white",
						zIndex: -5,
					}}
				/>
				<View
					style={{
						padding: 20,
						borderRadius: 20,
						backgroundColor: theme.colors.background,
						justifyContent: "center",
						shadowColor: "#000",
						shadowOffset: { width: 0, height: 1 },
						shadowOpacity: 0.1,
						shadowRadius: 2,
						elevation: 2,
					}}
					className="mx-4"
				>
					<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
						<Text
							variant="titleMedium"
							style={{
								fontFamily: theme.colors.fontBold,
								color: theme.colors.onBackground,
							}}
						>
							Total Earnings
						</Text>
						<TouchableOpacity
							style={{ flexDirection: "row", alignItems: "center" }}
							onPress={handleAddBankAccount}
						>
							{/* <FontAwesome name="plus-square-o" size={20} color={theme.colors.primary} /> */}
							<Text
								style={{
									fontFamily: theme.colors.fontRegular,
									color: theme.colors.primary,
									marginLeft: 8,
								}}
							>
								Withdraw Methods
							</Text>
						</TouchableOpacity>
					</View>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
							marginTop: 10,
						}}
					>
						<Text
							variant="headlineMedium"
							style={{
								fontFamily: theme.colors.fontRegular,
								color: theme.colors.bodyColor,
							}}
						>
							${(earningsData?.availableBalance || 0).toFixed(2)}
						</Text>
					</View>
					<View
						style={{
							flexDirection: "column",
							justifyContent: "space-between",
							alignItems: "center",
							marginTop: 10,
						}}
					>
						<Button
							onPress={handleCreatePayout}
							mode="contained"
							className="w-full mb-2"
							theme={{ roundness: 2 }}
							disabled={!userDetails?.user?.stripeConnectedAccountId}
							key={userDetails?.user?.stripeConnectedAccountId ? "enabled" : "disabled"}
						>
							<Text
								style={{
									color: userDetails?.user?.stripeConnectedAccountId
										? theme.colors.buttonText
										: theme.colors.onSurfaceDisabled,
									fontFamily: theme.colors.fontBold,
									padding: 5,
								}}
							>
								Withdraw
							</Text>
						</Button>
						<Button
							onPress={handleViewStripeDashboard}
							mode="contained"
							className="w-full mb-2"
							theme={{ roundness: 2 }}
							disabled={!userDetails?.user?.stripeConnectedAccountId}
							key={userDetails?.user?.stripeConnectedAccountId ? "dashboard" : "no dashboard"}
						>
							<Text
								style={{
									color: userDetails?.user?.stripeConnectedAccountId
										? theme.colors.buttonText
										: theme.colors.onSurfaceDisabled,
									fontFamily: theme.colors.fontBold,
									padding: 5,
								}}
							>
								View Payments Dashboard
							</Text>
						</Button>
						<Button
							onPress={handleViewEarningDetails}
							mode="outlined"
							className="w-full"
							theme={{ roundness: 2 }}
						>
							<Text
								style={{
									fontFamily: theme.colors.fontBold,
									padding: 5,
								}}
							>
								View Upcoming Earnings
							</Text>
						</Button>
					</View>
				</View>
				<View className="px-4 pt-4 pb-2">
					<Text
						style={{
							fontFamily: theme.colors.fontSemiBold,
							fontSize: 20,
							color: theme.colors.onBackground,
							marginBottom: 8,
						}}
					>
						Payout History
					</Text>
				</View>
				<ScrollView
					ref={scrollViewRef}
					contentContainerStyle={{ flexGrow: 1 }}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={isRefreshing || earningsLoading}
							onRefresh={async () => {
								setIsRefreshing(true);
								await refetchEarnings();
								scrollViewRef.current?.scrollTo({ y: 0, animated: true });
								setIsRefreshing(false);
							}}
							colors={[theme.colors.primary]}
						/>
					}
				>
					{earningsData?.payouts?.length === 0 ? (
						<View className="px-4 py-12 items-center">
							<Text
								variant="titleMedium"
								style={{
									fontFamily: theme.colors.fontSemiBold,
									color: theme.colors.onBackground,
									marginBottom: 8,
								}}
							>
								No Payouts Yet
							</Text>
							<Text
								style={{
									fontFamily: theme.colors.fontRegular,
									color: theme.colors.bodyColor,
									textAlign: "center",
									maxWidth: "80%",
								}}
							>
								Information related to payouts will be shown here when transactions are available.
							</Text>
						</View>
					) : (
						<View className="px-4">
							{earningsData?.payouts?.map((payout: any, index: any) => (
								<View
									key={index}
									style={{
										flexDirection: "row",
										justifyContent: "space-between",
										alignItems: "center",
										paddingVertical: 12,
										borderBottomWidth: 1,
										borderBottomColor: "#f0f0f0",
									}}
								>
									<View style={{ flexDirection: "row", alignItems: "center" }}>
										<Image
											source={getPayoutIcon(payout.destinationDetails.type)}
											style={{ width: 40, height: 40 }}
										/>
										<View style={{ marginLeft: 16 }}>
											<Text
												style={{
													fontFamily: theme.colors.fontSemiBold,
													color: theme.colors.onBackground,
												}}
											>
												{getPayoutType(payout.destinationDetails.type)}
											</Text>
											<Text
												style={{
													fontFamily: theme.colors.fontSemiBold,
													color: theme.colors.onBackground,
												}}
											>
												{`**** ${payout.destinationDetails.last4}`}
											</Text>
											<Text
												style={{
													fontFamily: theme.colors.fontRegular,
													color: theme.colors.bodyColor,
												}}
											>
												{new Date(payout.createdAt).toLocaleString("en-US", {
													year: "numeric",
													month: "short",
													day: "numeric",
													hour: "numeric",
													minute: "numeric",
													hour12: true,
												})}
											</Text>
										</View>
									</View>
									<View style={{ alignItems: "flex-end" }}>
										<Text
											style={{
												fontFamily: theme.colors.fontSemiBold,
												color:
													payout.status == "paid"
														? theme.colors.success
														: payout.status == "pending"
															? theme.colors.warning
															: theme.colors.error,
												marginBottom: 4,
											}}
											variant="bodyLarge"
										>
											{payout.status == "paid" || payout.status == "pending" ? "-" : "+"}{" "}
											{payout.amount} {payout.currency.toUpperCase()}
										</Text>
										<View
											style={{
												backgroundColor:
													payout.status == "paid"
														? theme.colors.success
														: payout.status == "pending"
															? theme.colors.warning
															: theme.colors.error,
												paddingHorizontal: 8,
												paddingVertical: 4,
												borderRadius: 16,
											}}
										>
											<Text
												style={{
													fontFamily: theme.colors.fontRegular,
													color: theme.colors.onPrimary,
												}}
												variant="labelSmall"
											>
												{payout.status}
											</Text>
										</View>
									</View>
								</View>
							))}
						</View>
					)}
				</ScrollView>
			</View>
			<Portal>
				<Dialog
					visible={dialogVisible}
					onDismiss={() => setDialogVisible(false)}
					theme={{ roundness: 2 }}
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						backgroundColor: theme.colors.background,
					}}
				>
					<Dialog.Title style={{ fontFamily: theme.colors.fontBold, color: theme.colors.onBackground }}>
						Enter Payout Amount
					</Dialog.Title>
					<Dialog.Content>
						<View className="min-w-full">
							<TextInput
								mode="outlined"
								label="Amount (Minimum $20)"
								placeholder="Enter a payout amount"
								style={{
									width: "100%",
								}}
								placeholderTextColor={theme.colors.placeholder}
								onChangeText={(text) => setPayoutAmount(text)}
								keyboardType="numeric"
							/>
						</View>
						{payoutAmount &&
							(Number(payoutAmount) < 20 ||
								!Number.isInteger(Number(payoutAmount)) ||
								!/^\d+$/.test(payoutAmount)) && (
								<View className="w-full">
									<Text
										style={{
											color: theme.colors.error,
											fontFamily: theme.colors.fontRegular,
											fontSize: 12,
										}}
									>
										Please enter a valid amount.
									</Text>
								</View>
							)}
					</Dialog.Content>
					<Dialog.Actions>
						<Button
							onPress={() => setDialogVisible(false)}
							mode="text"
							theme={{ roundness: 2 }}
							style={{
								minWidth: 150,
							}}
						>
							Cancel
						</Button>
						<Button
							onPress={confirmPayout}
							mode="contained"
							loading={isCreatingPayout}
							disabled={isCreatingPayout}
							theme={{ roundness: 2 }}
							style={{
								minWidth: 150,
							}}
						>
							<Text style={{ color: theme.colors.buttonText, fontFamily: theme.colors.fontBold }}>
								Confirm
							</Text>
						</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>
			<CustomSnackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
				{snackbarMessage}
			</CustomSnackbar>
		</SafeAreaView>
	);
};

export default withAuthCheck(Balance);
