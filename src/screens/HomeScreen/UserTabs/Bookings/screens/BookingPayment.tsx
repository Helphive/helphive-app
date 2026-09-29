import React, { FC, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { formatDate, formatMoney } from "../../../../../utils/format";
import CustomSnackbar from "../../../../../components/CustomSnackbar";
import ActionBar, { BarAction } from "../../../../../components/details/ActionBar";
import DetailsHeader from "../../../../../components/details/DetailsHeader";
import InfoCard from "../../../../../components/details/InfoCard";
import InfoRow from "../../../../../components/details/InfoRow";
import PriceBreakdown from "../../../../../components/details/PriceBreakdown";
import { PAGE_BACKGROUND, SCREEN_PADDING } from "../../../../../components/details/tokens";
import useConfirmedAction from "../../../../../components/details/useConfirmedAction";

interface Props {
	userDetails: any;
}

const BookingPayment: FC<Props> = ({ userDetails }) => {
	const [loading, setLoading] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState("");
	const dispatch = useDispatch();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const theme = useAppTheme();
	const { initPaymentSheet, presentPaymentSheet } = useStripe();
	const [cancelBooking] = useCancelBookingMutation();

	const bookingId = useSelector(selectBookingId);
	const clientSecret = useSelector(selectClientSecret);
	const bookingInfo = useSelector(selectBookingInfo);
	const paymentStatus = useSelector(selectPaymentStatus);

	const { ask, busyKey, dialog } = useConfirmedAction(async () => navigation.goBack(), setSnackbarMessage);

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
		if (error) setSnackbarMessage("Error initializing payment sheet: " + error.message);
	};

	const openPaymentSheet = async () => {
		const { error } = await presentPaymentSheet();
		if (error) {
			setSnackbarMessage("Payment failed: " + error.message);
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
		} finally {
			setLoading(false);
		}
	};

	const handleCancelBooking = () =>
		ask({
			key: "cancel",
			title: "Cancel this booking?",
			message: "This cannot be undone.",
			buttonText: "Yes, cancel booking",
			destructive: true,
			run: () => cancelBooking({ bookingId }).unwrap(),
			errorMessage: "Cancellation failed: An error occurred while cancelling the booking.",
		});

	const rate = Number(bookingInfo?.rate) || 0;
	const hours = Number(bookingInfo?.hours) || 0;
	const total = rate * hours;
	const paid = paymentStatus === "completed";

	const actions: BarAction[] = [];
	if (paymentStatus === "pending") {
		actions.push({
			label: `Pay ${formatMoney(total)}`,
			icon: "lock-outline",
			loading,
			disabled: !!busyKey,
			onPress: handlePayment,
		});
	}
	actions.push({
		label: "Cancel booking",
		mode: "outlined",
		destructive: true,
		disabled: loading,
		loading: busyKey === "cancel",
		onPress: handleCancelBooking,
	});

	return (
		<View style={{ flex: 1, backgroundColor: PAGE_BACKGROUND }}>
			<DetailsHeader title="Payment details" />
			<ScrollView
				contentContainerStyle={{ padding: SCREEN_PADDING, gap: 16 }}
				showsVerticalScrollIndicator={false}
			>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 12,
						padding: 16,
						borderRadius: 16,
						backgroundColor: paid ? "#ECFDF3" : "#FFFAEB",
					}}
				>
					<MaterialCommunityIcons
						name={paid ? "check-circle-outline" : "credit-card-clock-outline"}
						size={28}
						color={paid ? "#067647" : "#B54708"}
					/>
					<View style={{ flex: 1 }}>
						<Text style={{ fontFamily: theme.colors.fontSemiBold, color: paid ? "#067647" : "#B54708" }}>
							{paid ? "Payment complete" : "Payment required"}
						</Text>
						{!paid && (
							<Text style={{ fontSize: 13, color: theme.colors.bodyColor }}>
								Our pros cannot accept your booking until you pay.
							</Text>
						)}
					</View>
				</View>

				<InfoCard title="Booking">
					<InfoRow icon="briefcase-outline" label="Service" value={bookingInfo?.serviceName} />
					<InfoRow
						icon="calendar-clock"
						label="Start"
						value={`${formatDate(bookingInfo?.startDate)}, ${new Date(
							bookingInfo?.startTime,
						).toLocaleTimeString([], {
							hour: "numeric",
							minute: "2-digit",
						})}`}
					/>
					<InfoRow icon="pound" label="Booking ID" value={`#${bookingId?.slice(-6).toUpperCase()}`} />
				</InfoCard>

				<InfoCard title="Price">
					<PriceBreakdown
						lines={[
							{ label: "Hourly rate", value: formatMoney(rate) },
							{ label: "Hours", value: String(hours) },
						]}
						totalLabel="Total"
						total={total}
					/>
				</InfoCard>

				<InfoCard title="Payer">
					<InfoRow
						icon="account-outline"
						label="Name"
						value={`${userDetails?.firstName ?? ""} ${userDetails?.lastName ?? ""}`.trim()}
					/>
					<InfoRow icon="email-outline" label="Email" value={userDetails?.email} />
				</InfoCard>
			</ScrollView>
			<ActionBar actions={actions} />
			{dialog}
			<CustomSnackbar visible={!!snackbarMessage} onDismiss={() => setSnackbarMessage("")} duration={3000}>
				{snackbarMessage}
			</CustomSnackbar>
		</View>
	);
};

export default BookingPayment;
