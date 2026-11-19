import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { useNavigation } from "@react-navigation/native";
import {
	Button,
	ConfirmDialog,
	EmptyState,
	Notice,
	Panel,
	Screen,
	ScreenHeader,
	Skeleton,
	Text,
	color,
	radius,
	space,
	useToast,
} from "@/ui";
import { PaymentIcon, SecureIcon, SuccessIcon } from "@/ui/icons";
import { useAppDispatch, useAppSelector } from "@/store";
import { useCancelBookingMutation } from "@/features/auth/api";
import { getErrorMessage } from "@/services/api/errors";
import { formatDay, formatMoney, formatTime, pluralHours } from "@/lib/format";
import { selectPendingPayment, setPendingPayment } from "../slice";
import { ServiceIcon, serviceName } from "../services";
import { SummaryRow, TotalRow } from "../components/BookingSummary";

type SheetState = "loading" | "ready" | "failed";

/** Pay for a booking with Stripe's payment sheet (the web's "Complete payment" page at phone width). */
export default function BookingPaymentScreen() {
	const navigation = useNavigation();
	const dispatch = useAppDispatch();
	const toast = useToast();
	const pending = useAppSelector(selectPendingPayment);
	const { initPaymentSheet, presentPaymentSheet } = useStripe();
	const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation();

	const [sheet, setSheet] = useState<SheetState>("loading");
	const [sheetError, setSheetError] = useState<string | null>(null);
	const [paying, setPaying] = useState(false);
	const [paid, setPaid] = useState<{ total: number; service: string } | null>(null);
	const [confirmCancel, setConfirmCancel] = useState(false);

	const clientSecret = pending?.clientSecret;
	useEffect(() => {
		if (!clientSecret) return;
		let live = true;
		setSheet("loading");
		void initPaymentSheet({
			paymentIntentClientSecret: clientSecret,
			merchantDisplayName: "HelpHive",
			appearance: {
				colors: { primary: color.coral600, componentBorder: color.lineStrong, primaryText: color.ink900 },
				shapes: { borderRadius: radius.sm },
				primaryButton: { colors: { background: color.coral600, text: color.surface } },
			},
		}).then(({ error }) => {
			if (!live) return;
			setSheet(error ? "failed" : "ready");
			setSheetError(error ? error.message : null);
		});
		return () => {
			live = false;
		};
	}, [clientSecret, initPaymentSheet]);

	const goToBookings = () =>
		navigation.navigate("CustomerHome", { screen: "BookingsTab", params: { tab: "scheduled" } });

	if (paid) {
		return (
			<Screen header={<ScreenHeader title="Payment received" back={false} />}>
				<Panel>
					<View style={styles.done} accessibilityLiveRegion="polite">
						<SuccessIcon size={48} color={color.green700} />
						<Text variant="heading" align="center" accessibilityRole="header">
							Your booking is confirmed
						</Text>
						<Text variant="ui" color="ink600" align="center">
							{`We charged ${formatMoney(paid.total)} for your ${paid.service} booking. It stays scheduled until a provider accepts it.`}
						</Text>
						<Button onPress={goToBookings}>View my bookings</Button>
					</View>
				</Panel>
			</Screen>
		);
	}

	if (!pending) {
		return (
			<Screen header={<ScreenHeader title="Payment" />}>
				<EmptyState
					icon={PaymentIcon}
					title="There is nothing to pay for yet"
					description="Start a booking and you reach payment once the shift is set. Bookings you already created are under Scheduled."
					action={<Button onPress={goToBookings}>View scheduled bookings</Button>}
				/>
			</Screen>
		);
	}

	const total = pending.rate * pending.hours;
	const service = serviceName(pending.serviceId);

	const pay = async () => {
		setPaying(true);
		try {
			const { error } = await presentPaymentSheet();
			if (!error) {
				setPaid({ total, service });
				dispatch(setPendingPayment(null));
			} else if (error.code !== "Canceled") {
				toast.error(error.message || "The payment did not go through. Try again.");
			}
		} finally {
			setPaying(false);
		}
	};

	const cancel = async () => {
		try {
			await cancelBooking({ bookingId: pending.bookingId }).unwrap();
			setConfirmCancel(false);
			dispatch(setPendingPayment(null));
			toast.success("Booking cancelled");
			goToBookings();
		} catch (err) {
			setConfirmCancel(false);
			toast.error(getErrorMessage(err, "Could not cancel the booking. Try again."));
		}
	};

	return (
		<Screen
			header={<ScreenHeader title="Complete payment" />}
			footer={
				<View style={styles.footer}>
					<Button
						onPress={() => void pay()}
						loading={paying}
						disabled={sheet !== "ready" || cancelling}
						icon={SecureIcon}
						fullWidth
					>
						{paying ? "Processing payment" : `Pay ${formatMoney(total)}`}
					</Button>
					<Button variant="text" size="sm" onPress={() => setConfirmCancel(true)} disabled={paying}>
						Cancel booking
					</Button>
				</View>
			}
		>
			<Notice tone="warning" title="Payment required">
				Providers can accept your booking once it is paid.
			</Notice>

			{sheet === "failed" ? (
				<Notice tone="error" title="Card payment could not start">
					{`${sheetError ?? "Stripe did not respond."} Your booking is saved; try again from your bookings.`}
				</Notice>
			) : null}

			<Panel title="Order summary">
				<View style={styles.stack}>
					<View style={styles.service}>
						<ServiceIcon serviceId={pending.serviceId} tile />
						<View style={styles.flex}>
							<Text variant="uiStrong" weight="bold">
								{service}
							</Text>
							<Text variant="small">{`Reference ${pending.bookingId.slice(-6).toUpperCase()}`}</Text>
						</View>
					</View>
					<View>
						<SummaryRow label="Date" value={formatDay(pending.startAt)} />
						<SummaryRow label="Start" value={formatTime(pending.startAt)} />
						<SummaryRow label="Hours" value={pluralHours(pending.hours)} />
						<SummaryRow label="Hourly rate" value={formatMoney(pending.rate)} />
						<SummaryRow label="Address" value={pending.address} />
					</View>
					<TotalRow amount={total} />
				</View>
			</Panel>

			<View style={styles.secure}>
				{sheet === "loading" ? (
					<Skeleton width={180} height={12} />
				) : (
					<>
						<SecureIcon size={14} weight="bold" color={color.ink500} />
						<Text variant="caption">Payments are processed securely by Stripe.</Text>
					</>
				)}
			</View>

			<ConfirmDialog
				visible={confirmCancel}
				title="Cancel this booking?"
				description="This cannot be undone. Nothing has been charged yet."
				confirmLabel="Cancel booking"
				cancelLabel="Keep booking"
				destructive
				loading={cancelling}
				onConfirm={() => void cancel()}
				onClose={() => setConfirmCancel(false)}
			/>
		</Screen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	stack: { gap: space[4] },
	service: { flexDirection: "row", alignItems: "center", gap: space[3] },
	secure: { flexDirection: "row", alignItems: "center", gap: 6 },
	footer: { flex: 1, gap: space[1], alignItems: "center" },
	done: { alignItems: "center", gap: space[3], paddingVertical: space[5] },
});
