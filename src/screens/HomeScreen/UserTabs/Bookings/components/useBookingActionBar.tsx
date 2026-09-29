import React from "react";
import { Text } from "react-native-paper";
import { BarAction } from "../../../../../components/details/ActionBar";
import useConfirmedAction from "../../../../../components/details/useConfirmedAction";
import { useApproveStartJobRequestMutation } from "../../../../../features/user/userApiSlice";
import { useCancelBookingMutation, useCompleteBookingMutation } from "../../../../../features/auth/authApiSlice";
import { useAppTheme } from "../../../../../utils/theme";

// Customer-side actions: approve the provider's start request, complete, or cancel a booking.
const useBookingActionBar = (booking: any, refresh: () => Promise<any>, onError: (message: string) => void) => {
	const theme = useAppTheme();
	const [approveStart] = useApproveStartJobRequestMutation();
	const [completeBooking] = useCompleteBookingMutation();
	const [cancelBooking] = useCancelBookingMutation();
	const { ask, busyKey, dialog } = useConfirmedAction(refresh, onError);

	const bookingId = booking?._id as string;
	const actions: BarAction[] = [];
	let hint: React.ReactNode = null;

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

	if (booking?.status === "pending" && booking?.userApprovalRequested) {
		actions.push({
			label: "Approve start",
			icon: "check",
			loading: busyKey === "approve",
			onPress: () =>
				ask({
					key: "approve",
					title: "Approve job start?",
					message: "Your provider has arrived and asked to start. Approve to begin the job.",
					buttonText: "Approve",
					run: () => approveStart({ bookingId }).unwrap(),
					errorMessage: "An error occurred while starting the booking.",
				}),
		});
	} else if (booking?.status === "pending" && booking?.providerId) {
		hint = (
			<Text style={{ color: theme.colors.bodyColor, textAlign: "center", fontSize: 13 }}>
				Your provider will ask for approval when the job is ready to start.
			</Text>
		);
	}

	if (booking?.status === "pending" || booking?.status === "in progress") {
		actions.push({
			label: "Cancel booking",
			mode: "outlined",
			destructive: true,
			loading: busyKey === "cancel",
			onPress: () =>
				ask({
					key: "cancel",
					title: "Cancel this booking?",
					message: "This cannot be undone.",
					buttonText: "Yes, cancel booking",
					destructive: true,
					run: () => cancelBooking({ bookingId }).unwrap(),
					errorMessage: "An error occurred while cancelling the booking.",
				}),
		});
	}

	return { actions, hint, dialog };
};

export default useBookingActionBar;
