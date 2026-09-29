import { TimelineStep } from "./Timeline";

type TimelineInput = {
	status?: string;
	createdAt?: string | null;
	hasProvider?: boolean;
	startedAt?: string | null;
	completedAt?: string | null;
	cancelledAt?: string | null;
	cancellationReason?: string | null;
	expired?: boolean;
};

// Builds the booked -> accepted -> started -> completed/cancelled steps.
// Works for both the raw booking document and the receipt (which has no createdAt).
export const buildBookingTimeline = (b: TimelineInput): TimelineStep[] => {
	const cancelled = b.status === "cancelled";
	const completed = b.status === "completed";
	const inProgress = b.status === "in progress";
	const started = inProgress || completed || !!b.startedAt;
	const accepted = !!b.hasProvider || started;

	const steps: TimelineStep[] = [
		{ key: "booked", label: "Booked", date: b.createdAt, state: "done" },
		{
			key: "accepted",
			label: "Accepted by provider",
			state: accepted ? "done" : cancelled ? "pending" : "current",
		},
	];

	if (cancelled) {
		if (started) steps.push({ key: "started", label: "Started", date: b.startedAt, state: "done" });
		steps.push({
			key: "cancelled",
			label: b.expired ? "Expired" : "Cancelled",
			date: b.cancelledAt,
			state: "cancelled",
			note: b.cancellationReason,
		});
		return steps;
	}

	steps.push({
		key: "started",
		label: "Started",
		date: b.startedAt,
		state: started ? "done" : accepted ? "current" : "pending",
	});
	steps.push({
		key: "completed",
		label: "Completed",
		date: b.completedAt,
		state: completed ? "done" : inProgress ? "current" : "pending",
	});
	return steps;
};
