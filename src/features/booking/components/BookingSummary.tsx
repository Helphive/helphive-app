import React from "react";
import { StyleSheet, View } from "react-native";
import type { Dayjs } from "dayjs";
import { Button, Panel, Text, color, space } from "@/ui";
import { SecureIcon } from "@/ui/icons";
import { formatDay, formatMoney, formatTime } from "@/lib/format";
import { ServiceIcon } from "../services";

/** One label/value line (the web's inline DataRow). */
export function SummaryRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
	return (
		<View style={styles.row}>
			<Text variant="ui" color="ink600">
				{label}
			</Text>
			<Text variant="uiStrong" color={muted ? "ink500" : "ink900"} align="right" style={styles.value}>
				{value}
			</Text>
		</View>
	);
}

export function TotalRow({ label = "Total", amount }: { label?: string; amount: number }) {
	return (
		<View style={[styles.row, styles.total]}>
			<Text variant="uiStrong" weight="bold">
				{label}
			</Text>
			<Text variant="figure">{formatMoney(amount)}</Text>
		</View>
	);
}

const NOT_SET = "Not chosen yet";

/** The booking summary panel at the end of the form. */
export function BookingSummary({
	serviceId,
	serviceName,
	start,
	address,
	rate,
	hours,
}: {
	serviceId: number | null;
	serviceName: string | null;
	start: Dayjs | null;
	address: string;
	rate: number;
	hours: number;
}) {
	return (
		<Panel title="Booking summary">
			<View style={styles.stack}>
				<View style={styles.service}>
					<ServiceIcon serviceId={serviceId} tile />
					<Text variant="uiStrong" weight="bold" style={styles.flex}>
						{serviceName ?? "No service chosen"}
					</Text>
				</View>
				<View>
					<SummaryRow label="Date" value={start ? formatDay(start) : NOT_SET} muted={!start} />
					<SummaryRow label="Start" value={start ? formatTime(start) : NOT_SET} muted={!start} />
					<SummaryRow label="Address" value={address || NOT_SET} muted={!address} />
					<SummaryRow label="Rate" value={`${formatMoney(rate)}/hr`} />
					<SummaryRow label="Hours" value={String(hours)} />
				</View>
				<TotalRow amount={rate * hours} />
				<View style={styles.secure}>
					<SecureIcon size={16} weight="bold" color={color.ink500} />
					<Text variant="caption" style={styles.flex}>
						You pay on the next step with Stripe. The booking stays scheduled until a provider accepts it.
					</Text>
				</View>
			</View>
		</Panel>
	);
}

/** The sticky bar under the form: total, what is still needed, and the one primary action. */
export function SummaryBar({
	total,
	hours,
	rate,
	missing,
	submitting,
	onSubmit,
}: {
	total: number;
	hours: number;
	rate: number;
	missing: string[];
	submitting: boolean;
	onSubmit: () => void;
}) {
	const hint =
		missing.length > 0
			? `Still needed: ${missing[0]}${missing.length > 1 ? ` and ${missing.length - 1} more` : ""}`
			: `${hours} ${hours === 1 ? "hour" : "hours"} at ${formatMoney(rate)}/hr`;
	return (
		<>
			<View style={styles.flex} accessible accessibilityLabel={`Total ${formatMoney(total)}. ${hint}`}>
				<Text variant="subheading" weight="extrabold">
					{formatMoney(total)}
				</Text>
				<Text variant="caption" numberOfLines={2}>
					{hint}
				</Text>
			</View>
			<Button onPress={onSubmit} loading={submitting}>
				{submitting ? "Creating booking" : "Proceed to payment"}
			</Button>
		</>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	stack: { gap: space[4] },
	service: { flexDirection: "row", alignItems: "center", gap: space[3] },
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "baseline",
		gap: space[4],
		paddingVertical: 6,
	},
	value: { flexShrink: 1 },
	total: { borderTopWidth: 1, borderTopColor: color.line, paddingTop: space[4], marginTop: space[1] },
	secure: { flexDirection: "row", gap: space[2], alignItems: "flex-start" },
});
