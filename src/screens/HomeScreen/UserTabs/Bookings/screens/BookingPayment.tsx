import React, { FC, useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Image } from "react-native";
import { Text, Button } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useDispatch, useSelector } from "react-redux";
import { useStripe } from "@stripe/stripe-react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useCancelBookingMutation } from "../../../../../features/auth/authApiSlice";

import {
	selectBookingId,
	selectClientSecret,
	selectBookingInfo,
	selectPaymentStatus,
	setPaymentStatus,
} from "../../../../../features/booking/bookingSlice";
import { RootStackParamList } from "../../../../../utils/CustomTypes";
import { useAppTheme } from "../../../../../utils/theme";
import CustomSnackbar from "../../../../../components/CustomSnackbar";

const infoSquare = require("../../../../../../assets/icons/info-square.png");

interface Props {
	userDetails: any;
}

const BookingPayment: FC<Props> = ({ userDetails }) => {
	const [loading, setLoading] = useState(false);
	const [snackbarVisible, setSnackbarVisible] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState("");
	const dispatch = useDispatch();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const theme = useAppTheme();
	const { initPaymentSheet, presentPaymentSheet } = useStripe();
	const [cancelBooking, { isLoading: isCancelLoading }] = useCancelBookingMutation();

	const bookingId = useSelector(selectBookingId);
	const clientSecret = useSelector(selectClientSecret);
	const bookingInfo = useSelector(selectBookingInfo);
	const paymentStatus = useSelector(selectPaymentStatus);

	const initializePaymentSheet = async () => {
		const { error } = await initPaymentSheet({
			paymentIntentClientSecret: clientSecret,
			merchantDisplayName: "Helphive",
			appearance: {
				primaryButton: {
					colors: {
						background: theme.colors.primary,
					},
				},
			},
		});
		if (error) {
			setSnackbarMessage("Error initializing payment sheet: " + error.message);
			setSnackbarVisible(true);
		}
	};

	const openPaymentSheet = async () => {
		const { error } = await presentPaymentSheet();
		if (error) {
			setSnackbarMessage("Payment failed: " + error.message);
			setSnackbarVisible(true);
		} else {
			dispatch(setPaymentStatus("completed"));
		}
	};

	useEffect(() => {
		initializePaymentSheet();
	}, []);

	const handlePayment = async () => {
		setLoading(true);
		try {
			await openPaymentSheet();
		} catch (err) {
			console.error(err);
			setSnackbarMessage("Payment failed: An error occurred while processing the payment.");
			setSnackbarVisible(true);
		} finally {
			setLoading(false);
		}
	};

	const handleCancelBooking = async () => {
		try {
			await cancelBooking({ bookingId }).unwrap();
			setSnackbarMessage("Booking cancelled successfully.");
			setSnackbarVisible(true);
			navigation.goBack();
		} catch (err) {
			console.error(err);
			setSnackbarMessage("Cancellation failed: An error occurred while cancelling the booking.");
			setSnackbarVisible(true);
		}
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<StatusBar backgroundColor={theme.colors.primary} />
			<View style={{ paddingHorizontal: 20, paddingVertical: 15, backgroundColor: theme.colors.primary }}>
				<TouchableOpacity
					onPress={() => navigation.goBack()}
					style={{ flexDirection: "row", alignItems: "center" }}
				>
					<MaterialIcons name="chevron-left" size={28} color={theme.colors.onPrimary} />
					<Text
						style={{
							color: theme.colors.onPrimary,
							fontSize: 18,
							fontFamily: theme.colors.fontSemiBold,
							marginLeft: 10,
						}}
					>
						Payment Details
					</Text>
				</TouchableOpacity>
			</View>
			<View className="px-4 flex-1">
				<ScrollView style={{ flex: 1, backgroundColor: theme.colors.surface }} className="py-4">
					<View
						style={{
							padding: 20,
							borderWidth: 1,
							borderColor: theme.colors.onSurfaceDisabled,
							borderRadius: 8,
						}}
					>
						<Text
							style={{
								fontSize: 20,
								fontFamily: theme.colors.fontSemiBold,
								marginBottom: 20,
								color: theme.colors.onSurface,
								textAlign: "center",
							}}
						>
							Invoice
						</Text>
						<View style={{ marginBottom: 20 }}>
							<Text
								style={{
									fontSize: 16,
									fontFamily: theme.colors.fontSemiBold,
									color: theme.colors.onSurface,
								}}
							>
								Booking Details
							</Text>
							<View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
								<Text style={{ color: theme.colors.onSurface }}>Booking ID:</Text>
								<Text style={{ color: theme.colors.onSurface }}>
									#{bookingId?.slice(-6).toUpperCase()}
								</Text>
							</View>
							<View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
								<Text style={{ color: theme.colors.onSurface }}>Hourly Rate:</Text>
								<Text style={{ color: theme.colors.onSurface }}>
									USD {parseFloat(bookingInfo.rate).toFixed(2)}
								</Text>
							</View>
							<View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
								<Text style={{ color: theme.colors.onSurface }}>Number of Hours:</Text>
								<Text style={{ color: theme.colors.onSurface }}>{bookingInfo.hours}</Text>
							</View>
							<View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
								<Text style={{ color: theme.colors.onSurface }}>Amount:</Text>
								<Text style={{ color: theme.colors.onSurface }}>
									USD {(bookingInfo.rate * bookingInfo.hours).toFixed(2)}
								</Text>
							</View>
							<View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
								<Text style={{ color: theme.colors.onSurface }}>Service:</Text>
								<Text style={{ color: theme.colors.onSurface }}>{bookingInfo.serviceName}</Text>
							</View>
							<View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
								<Text style={{ color: theme.colors.onSurface }}>Start Date:</Text>
								<Text style={{ color: theme.colors.onSurface }}>
									{new Date(bookingInfo.startDate).toLocaleDateString()}
								</Text>
							</View>
							<View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
								<Text style={{ color: theme.colors.onSurface }}>Start Time:</Text>
								<Text style={{ color: theme.colors.onSurface }}>
									{new Date(bookingInfo.startTime).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</Text>
							</View>
						</View>

						<View style={{ marginBottom: 20 }}>
							<Text
								style={{
									fontSize: 16,
									fontFamily: theme.colors.fontSemiBold,
									color: theme.colors.onSurface,
								}}
							>
								Payer's Information
							</Text>
							<View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
								<Text style={{ color: theme.colors.onSurface }}>User:</Text>
								<Text style={{ color: theme.colors.onSurface }}>
									{userDetails.firstName} {userDetails.lastName}
								</Text>
							</View>
							<View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
								<Text style={{ color: theme.colors.onSurface }}>Email:</Text>
								<Text style={{ color: theme.colors.onSurface }}>
									{userDetails.email.length > 32
										? `${userDetails?.email?.slice(0, 31)}...`
										: userDetails.email}
								</Text>
							</View>
						</View>
						<View style={{ alignItems: "flex-end" }}>
							<View
								style={{
									backgroundColor:
										paymentStatus === "completed"
											? theme.colors.success
											: paymentStatus === "pending"
												? theme.colors.warning
												: theme.colors.error,
									paddingVertical: 5,
									paddingHorizontal: 10,
									borderRadius: 20,
									alignSelf: "flex-end",
								}}
							>
								<Text
									variant="labelSmall"
									style={{
										color: theme.colors.onPrimary,
										fontFamily: theme.colors.fontSemiBold,
									}}
								>
									{paymentStatus === "completed" ? "Payment Complete" : "Payment Required"}
								</Text>
							</View>
						</View>
					</View>
					{paymentStatus === "pending" && (
						<View className="flex flex-row items-center py-2">
							<Image source={infoSquare} style={{ width: 20, height: 20 }} />
							<Text
								variant="bodySmall"
								style={{
									fontFamily: theme.colors.fontRegular,
									color: theme.colors.onSurface,
									textAlign: "left",
								}}
								className="ml-1"
							>
								Our pros can't accept your booking unless you pay.
							</Text>
						</View>
					)}
				</ScrollView>

				<View style={{ backgroundColor: theme.colors.surface }}>
					{paymentStatus === "pending" && (
						<Button
							mode="contained"
							onPress={handlePayment}
							loading={loading}
							disabled={loading}
							theme={{
								roundness: 2,
							}}
							className="mb-2"
							key={loading ? "loading" : "loaded"}
						>
							<Text
								style={{
									color: loading ? theme.colors.onSurfaceDisabled : theme.colors.onPrimary,
									padding: 5,
									fontFamily: theme.colors.fontBold,
								}}
							>
								Confirm Payment
							</Text>
						</Button>
					)}
					<Button
						mode="outlined"
						onPress={handleCancelBooking}
						loading={isCancelLoading}
						disabled={isCancelLoading}
						theme={{
							roundness: 2,
						}}
						className="mb-4"
					>
						<Text
							style={{
								color: isCancelLoading ? theme.colors.onSurfaceDisabled : theme.colors.bodyColor,
								padding: 5,
								fontFamily: theme.colors.fontBold,
							}}
						>
							Cancel Booking
						</Text>
					</Button>
				</View>
			</View>
			<CustomSnackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
				{snackbarMessage}
			</CustomSnackbar>
		</SafeAreaView>
	);
};

export default BookingPayment;
