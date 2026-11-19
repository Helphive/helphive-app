import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Button, ConfirmDialog, useToast } from "@/ui";
import { ReceiptIcon } from "@/ui/icons";
import { getDisplayStatus } from "@/lib/format";
import { getErrorMessage } from "@/services/api/errors";
import { useAppDispatch } from "@/store";
import { useCancelBookingMutation, useCompleteBookingMutation } from "@/features/auth/api";
import { useApproveStartJobRequestMutation } from "@/features/customer/api";
import { setPendingPayment } from "@/features/booking/slice";
import type { Booking, BookingPayment } from "@/features/customer/types";

type Action = "approve" | "complete" | "cancel";

const CONFIRM: Record<
	Action,
	{ title: string; description: string; label: string; done: string; failed: string; destructive?: boolean }
> = {
	approve: {
		title: "Approve job start?",
		description: "The provider has arrived and is ready to begin. Approving marks the job as in progress.",
		label: "Approve job start",
		done: "Job start approved",
		failed: "Could not approve the job start. Try again.",
	},
	complete: {
		title: "Mark this job as completed?",
		description: "Confirm that the work is finished. The provider is paid once the job is completed.",
		label: "Complete job",
		done: "Job completed",
		failed: "Could not complete the job. Try again.",
	},
	cancel: {
		title: "Cancel this booking?",
		description: "This cannot be undone. If you have already paid, a refund will be issued.",
		label: "Cancel booking",
		done: "Booking cancelled. Any payment will be refunded.",
		failed: "Could not cancel the booking. Try again.",
		destructive: true,
	},
};

/**
 * The customer's actions on a booking, each behind a confirm dialog: pay (unpaid and scheduled), approve the
 * start, complete, cancel (only while the server allows it: before the job starts), and the receipt.
 * Returns the primary action for the sticky footer, the rest for the actions panel, and the dialog.
 */
export function useBookingActions(booking: Booking | undefined, payment: BookingPayment | null | undefined) {
	const navigation = useNavigation();
	const dispatch = useAppDispatch();
	const toast = useToast();
	const [approve, approveState] = useApproveStartJobRequestMutation();
	const [complete, completeState] = useCompleteBookingMutation();
	const [cancel, cancelState] = useCancelBookingMutation();
	const [asking, setAsking] = useState<Action | null>(null);

	if (!booking) return { primary: null, secondary: null, dialog: null };
	const bookingId = booking._id;
	const status = getDisplayStatus(booking);
	const busy = approveState.isLoading || completeState.isLoading || cancelState.isLoading;

	const run = async (action: Action) => {
		const c = CONFIRM[action];
		try {
			const call = action === "approve" ? approve : action === "complete" ? complete : cancel;
			await call({ bookingId }).unwrap();
			toast.success(c.done);
		} catch (err) {
			toast.error(getErrorMessage(err, c.failed));
		} finally {
			setAsking(null);
		}
	};

	const canPay =
		status === "scheduled" && payment?.status === "pending" && !!payment.clientSecret && !payment.refundId;
	const pay = () => {
		if (!payment?.clientSecret) return;
		dispatch(
			setPendingPayment({
				bookingId,
				clientSecret: payment.clientSecret,
				paymentIntentId: payment.paymentIntentId,
				serviceId: booking.service?.id,
				rate: booking.rate,
				hours: booking.hours,
				startAt: booking.startDate,
				address: booking.address,
				latitude: booking.latitude,
				longitude: booking.longitude,
			}),
		);
		navigation.navigate("BookingPayment");
	};

	const primary = canPay ? (
		<Button onPress={pay} fullWidth>
			Pay now
		</Button>
	) : status === "awaiting_start_approval" ? (
		<Button onPress={() => setAsking("approve")} fullWidth>
			Approve job start
		</Button>
	) : status === "in_progress" ? (
		<Button onPress={() => setAsking("complete")} fullWidth>
			Complete job
		</Button>
	) : null;

	const canCancel = status === "scheduled" || status === "accepted" || status === "awaiting_start_approval";
	const secondary = (
		<>
			{canCancel ? (
				<Button variant="secondary" onPress={() => setAsking("cancel")} fullWidth>
					Cancel booking
				</Button>
			) : null}
			<Button
				variant="secondary"
				icon={ReceiptIcon}
				onPress={() => navigation.navigate("Receipt", { bookingId })}
				fullWidth
			>
				View receipt
			</Button>
		</>
	);

	const c = asking ? CONFIRM[asking] : null;
	const dialog = (
		<ConfirmDialog
			visible={!!c}
			title={c?.title ?? ""}
			description={c?.description}
			confirmLabel={c?.label ?? ""}
			cancelLabel={asking === "cancel" ? "Keep booking" : "Not now"}
			destructive={c?.destructive}
			loading={busy}
			onConfirm={() => asking && void run(asking)}
			onClose={() => setAsking(null)}
		/>
	);

	return { primary, secondary, dialog };
}
