import React from "react";
import { View } from "react-native";
import { BOOKING_STATUS, Text, space, type BookingDisplayStatus, byScheme, makeStyles, useTheme } from "@/ui";
import { CheckMarkIcon, CloseIcon } from "@/ui/icons";
import { formatDayTime } from "@/lib/format";

type StepState = "done" | "current" | "pending" | "error";
interface Step {
	label: string;
	date?: string | null;
	state: StepState;
	note?: string | null;
}

export interface TimelineInput {
	status: BookingDisplayStatus;
	hasProvider: boolean;
	createdAt?: string | null;
	startedAt?: string | null;
	completedAt?: string | null;
	cancelledAt?: string | null;
	cancellationReason?: string | null;
}

/** Booked, accepted, (start requested,) started, completed; or the steps up to a cancellation. Same as the web. */
export function buildTimeline(b: TimelineInput): Step[] {
	const steps: Step[] = [{ label: "Booked", date: b.createdAt, state: "done" }];
	if (b.status === "cancelled" || b.status === "expired") {
		if (b.hasProvider) steps.push({ label: "Accepted", state: "done" });
		if (b.startedAt) steps.push({ label: "Started", date: b.startedAt, state: "done" });
		steps.push({
			label: BOOKING_STATUS[b.status].label,
			date: b.cancelledAt,
			state: "error",
			note: b.cancellationReason,
		});
		return steps;
	}
	const started = b.status === "in_progress" || b.status === "completed";
	const flags = [
		{ label: "Accepted", done: b.hasProvider },
		...(b.status === "awaiting_start_approval" ? [{ label: "Start requested", done: true }] : []),
		{ label: "Started", date: b.startedAt, done: started },
		{ label: "Completed", date: b.completedAt, done: b.status === "completed" },
	];
	let currentSet = false;
	for (const f of flags) {
		let state: StepState = "pending";
		if (f.done) state = "done";
		else if (!currentSet) {
			state = "current";
			currentSet = true;
		}
		steps.push({ label: f.label, date: "date" in f ? f.date : undefined, state });
	}
	return steps;
}

const DOT = byScheme(
	(color): Record<StepState, string> => ({
		done: color.inkFill,
		current: color.brandFill,
		pending: color.lineStrong,
		error: color.redFill,
	}),
);
const STATE_LABEL: Record<StepState, string> = { done: "done", current: "next", pending: "to come", error: "" };

export function StatusTimeline(props: TimelineInput) {
	const { color, scheme } = useTheme();
	const styles = useStyles();
	const steps = buildTimeline(props);
	return (
		<View>
			{steps.map((s, i) => {
				const last = i === steps.length - 1;
				return (
					<View
						key={s.label}
						style={styles.step}
						accessible
						accessibilityLabel={[
							s.label,
							STATE_LABEL[s.state],
							s.date ? formatDayTime(s.date) : null,
							s.note,
						]
							.filter(Boolean)
							.join(", ")}
					>
						<View style={styles.rail}>
							<View
								style={[
									styles.dot,
									s.state === "pending"
										? styles.dotPending
										: { backgroundColor: DOT[scheme][s.state], borderColor: DOT[scheme][s.state] },
								]}
							>
								{s.state === "done" ? (
									<CheckMarkIcon size={12} weight="bold" color={color.onInk} />
								) : null}
								{s.state === "error" ? (
									<CloseIcon size={12} weight="bold" color={color.onBrand} />
								) : null}
							</View>
							{!last ? <View style={styles.connector} /> : null}
						</View>
						<View style={[styles.text, !last && styles.textGap]}>
							<Text
								variant="uiStrong"
								weight={s.state === "current" ? "bold" : "semibold"}
								color={s.state === "pending" ? "ink500" : s.state === "error" ? "red700" : "ink900"}
							>
								{s.label}
							</Text>
							{s.date ? <Text variant="caption">{formatDayTime(s.date)}</Text> : null}
							{s.note ? <Text variant="small">{`Reason: ${s.note}`}</Text> : null}
						</View>
					</View>
				);
			})}
		</View>
	);
}

const useStyles = makeStyles(({ color }) => ({
	step: { flexDirection: "row", gap: space[3] },
	rail: { alignItems: "center", width: 20 },
	dot: {
		width: 20,
		height: 20,
		borderRadius: 10,
		borderWidth: 2,
		alignItems: "center",
		justifyContent: "center",
	},
	dotPending: { backgroundColor: color.surface, borderColor: color.lineStrong },
	connector: { flex: 1, width: 2, backgroundColor: color.line, marginVertical: 2 },
	text: { flex: 1, gap: 2, paddingTop: 1 },
	textGap: { paddingBottom: space[4] },
}));
