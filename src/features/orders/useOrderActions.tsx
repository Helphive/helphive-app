import React, { useState } from "react";
import { ConfirmDialog, useToast } from "@/ui";
import { getErrorMessage } from "@/services/api/errors";
import { getDisplayStatus } from "@/lib/format";
import { useStartBookingMutation } from "@/features/provider/api";
import { useCancelBookingMutation, useCompleteBookingMutation } from "@/features/auth/api";
import type { Booking } from "./types";

type Action = "start" | "complete" | "cancel";

const DIALOGS: Record<
	Action,
	{
		title: string;
		description: string;
		confirmLabel: string;
		cancelLabel?: string;
		destructive?: boolean;
		done: string;
		failed: string;
	}
> = {
	start: {
		title: "Start this job?",
		description: "The customer will be asked to approve the start. The job begins once they approve.",
		confirmLabel: "Send start request",
		done: "Start request sent to the customer",
		failed: "Could not start the job",
	},
	complete: {
		title: "Complete this job?",
		description: "Confirm the work is finished. Your earnings will be released after processing.",
		confirmLabel: "Complete job",
		done: "Job completed",
		failed: "Could not complete the job",
	},
	cancel: {
		title: "Cancel this order?",
		description: "The customer will be notified and refunded. This cannot be undone.",
		confirmLabel: "Cancel order",
		cancelLabel: "Keep order",
		destructive: true,
		done: "Order cancelled",
		failed: "Could not cancel the order",
	},
};

/** What the provider can do with their order now, each behind a confirm dialog. */
export function useOrderActions(booking: Booking | undefined) {
	const toast = useToast();
	const [open, setOpen] = useState<Action | null>(null);
	const [startBooking, start] = useStartBookingMutation();
	const [completeBooking, complete] = useCompleteBookingMutation();
	const [cancelBooking, cancel] = useCancelBookingMutation();
	const busy = start.isLoading || complete.isLoading || cancel.isLoading;

	const status = booking ? getDisplayStatus(booking) : null;
	const available: Record<Action, boolean> = {
		start: status === "accepted",
		complete: status === "in_progress",
		cancel: status === "accepted" || status === "awaiting_start_approval",
	};

	const run = async () => {
		if (!open || !booking) return;
		const d = DIALOGS[open];
		const bookingId = booking._id;
		try {
			if (open === "start") await startBooking({ bookingId }).unwrap();
			else if (open === "complete") await completeBooking({ bookingId }).unwrap();
			else await cancelBooking({ bookingId }).unwrap();
			setOpen(null);
			toast.success(d.done);
		} catch (err) {
			setOpen(null);
			toast.error(getErrorMessage(err, `${d.failed}. Try again.`));
		}
	};

	const d = open ? DIALOGS[open] : null;
	const dialog = (
		<ConfirmDialog
			visible={!!open}
			title={d?.title ?? ""}
			description={d?.description}
			confirmLabel={d?.confirmLabel ?? ""}
			cancelLabel={d?.cancelLabel}
			destructive={d?.destructive}
			loading={busy}
			onConfirm={run}
			onClose={() => (busy ? undefined : setOpen(null))}
		/>
	);

	return { status, available, ask: setOpen, busy, dialog };
}
