import React from "react";
import { Text } from "react-native-paper";
import { BarAction } from "../../../../../components/details/ActionBar";
import useConfirmedAction from "../../../../../components/details/useConfirmedAction";
import { useStartBookingMutation } from "../../../../../features/provider/providerApiSlice";
import { useCancelBookingMutation, useCompleteBookingMutation } from "../../../../../features/auth/authApiSlice";
import { useAppTheme } from "../../../../../utils/theme";

// Provider-side actions: start (request approval), complete, or cancel an accepted order.
const useOrderActionBar = (booking: any, refresh: () => Promise<any>, onError: (message: string) => void) => {
	const theme = useAppTheme();
	const [startBooking] = useStartBookingMutation();
	const [completeBooking] = useCompleteBookingMutation();
	const [cancelBooking] = useCancelBookingMutation();
	const { ask, busyKey, dialog } = useConfirmedAction(refresh, onError);

	const bookingId = booking?._id as string;
	const actions: BarAction[] = [];
	let hint: React.ReactNode = null;

	if (booking?.status === "pending") {
		const waiting = !!booking?.userApprovalRequested;
		actions.push({
			label: waiting ? "Waiting for approval" : "Start job",
			icon: waiting ? "clock-outline" : "play",
			disabled: waiting,
			loading: busyKey === "start",
			onPress: () =>
				ask({
					key: "start",
					title: "Start this job?",
					message: "The customer will be asked to approve the start of the job.",
					buttonText: "Start job",
					run: () => startBooking({ bookingId }).unwrap(),
					errorMessage: "An error occurred while starting the booking.",
				}),
		});
		if (waiting) {
			hint = (
				<Text style={{ color: theme.colors.bodyColor, textAlign: "center", fontSize: 13 }}>
					The customer has been asked to approve the start.
				</Text>
			);
		}
	}

	if (booking?.status === "in progress") {
		actions.push({
			label: "Complete job",
			icon: "check-all",
			loading: busyKey === "complete",
			onPress: () =>
				ask({
					key: "complete",
					title: "Complete this job?",
					message: "Confirm that the work has been finished.",
					buttonText: "Yes, complete",
					run: () => completeBooking({ bookingId }).unwrap(),
					errorMessage: "An error occurred while completing the booking.",
				}),
		});
	}

	if (booking?.status === "pending") {
		actions.push({
			label: "Cancel",
			mode: "outlined",
			destructive: true,
			loading: busyKey === "cancel",
			onPress: () =>
				ask({
					key: "cancel",
					title: "Cancel this order?",
					message: "This cannot be undone and the customer will be notified.",
					buttonText: "Yes, cancel order",
					destructive: true,
					run: () => cancelBooking({ bookingId }).unwrap(),
					errorMessage: "An error occurred while cancelling the booking.",
				}),
		});
	}

	return { actions, hint, dialog };
};

export default useOrderActionBar;
