import React, { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Logo, StatusPill, Text, color, radius, space, type Tone } from "@/ui";
import { formatDayTime, formatMoney, pluralHours } from "@/lib/format";
import { SummaryRow } from "@/features/booking/components/BookingSummary";
import type { BookingReceipt } from "../api";

const STATUS: Record<string, { label: string; tone: Tone }> = {
	pending: { label: "Pending", tone: "grey" },
	"in progress": { label: "In progress", tone: "blue" },
	completed: { label: "Completed", tone: "green" },
	cancelled: { label: "Cancelled", tone: "red" },
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<View style={styles.field}>
			<Text variant="caption">{label}</Text>
			{typeof children === "string" ? (
				<Text variant="uiStrong" weight="bold">
					{children}
				</Text>
			) : (
				children
			)}
		</View>
	);
}

function Section({ title, children, last }: { title?: string; children: ReactNode; last?: boolean }) {
	return (
		<View style={[styles.section, !last && styles.sectionLine]}>
			{title ? (
				<Text variant="uiStrong" weight="bold" accessibilityRole="header" style={styles.sectionTitle}>
					{title}
				</Text>
			) : null}
			{children}
		</View>
	);
}

/** The receipt sheet, as the web's ReceiptPage. Shared by both roles (the provider also sees the earning). */
export function ReceiptBody({ receipt }: { receipt: BookingReceipt }) {
	const money = (value: number) => formatMoney(value, receipt.currency);
	const payment = receipt.payment;
	const status = STATUS[receipt.status] ?? { label: capitalize(receipt.status), tone: "grey" as Tone };

	return (
		<View style={styles.sheet} accessibilityLabel="Receipt">
			<View style={[styles.head, styles.sectionLine]}>
				<Logo size={24} />
				<View style={styles.headRight}>
					<Text variant="uiStrong" weight="bold">
						{receipt.receiptNumber}
					</Text>
					<Text variant="caption">{`Issued ${formatDayTime(receipt.issuedAt)}`}</Text>
				</View>
			</View>

			<View style={styles.sectionLine}>
				<View style={styles.gridRow}>
					<View style={styles.cell}>
						<Field label="Service">{receipt.service?.name ?? "—"}</Field>
					</View>
					<View style={[styles.cell, styles.cellRight]}>
						<Field label="Status">
							<StatusPill tone={status.tone}>{status.label}</StatusPill>
						</Field>
					</View>
				</View>
				<View style={[styles.gridRow, styles.gridTop]}>
					<View style={styles.cell}>
						<Field label="Start">{formatDayTime(receipt.startDate)}</Field>
					</View>
					<View style={[styles.cell, styles.cellRight]}>
						<Field label="Duration">{pluralHours(receipt.hours)}</Field>
					</View>
				</View>
			</View>

			<Section>
				<View style={styles.fields}>
					<Field label="Customer">
						<View>
							<Text variant="uiStrong" weight="bold">
								{receipt.customer?.name || "—"}
							</Text>
							{receipt.customer?.email ? <Text variant="small">{receipt.customer.email}</Text> : null}
						</View>
					</Field>
					<Field label="Provider">{receipt.provider?.name ?? "Not assigned"}</Field>
					<Field label="Address">{receipt.address || "—"}</Field>
					{receipt.completedAt ? <Field label="Completed">{formatDayTime(receipt.completedAt)}</Field> : null}
					{receipt.cancelledAt ? (
						<Field label="Cancelled">
							{`${formatDayTime(receipt.cancelledAt)}${receipt.cancellationReason ? `, ${receipt.cancellationReason}` : ""}`}
						</Field>
					) : null}
				</View>
			</Section>

			<Section title="Charges">
				<SummaryRow label="Hourly rate" value={money(receipt.rate)} />
				<SummaryRow label="Hours" value={String(receipt.hours)} />
				<SummaryRow label="Subtotal" value={money(receipt.subtotal)} />
			</Section>

			<View style={[styles.total, styles.sectionLine]}>
				<Text variant="uiStrong" weight="bold">
					Total
				</Text>
				<Text variant="title">{money(receipt.total)}</Text>
			</View>

			<Section title="Payment" last>
				{payment ? (
					<>
						<SummaryRow label={`Payment ${payment.status}`} value={money(payment.amount)} />
						{payment.paidAt ? <SummaryRow label="Paid" value={formatDayTime(payment.paidAt)} /> : null}
						{/* The server sets refund fields only when a refund was issued (it has a refund id). */}
						{payment.refundStatus ? (
							<SummaryRow
								label={`Refund ${payment.refundStatus}`}
								value={`${money(payment.refundAmount)}${payment.refundedAt ? `, ${formatDayTime(payment.refundedAt)}` : ""}`}
							/>
						) : null}
					</>
				) : (
					<Text variant="ui" color="ink600">
						No payment recorded for this booking.
					</Text>
				)}
				{receipt.earning ? (
					<View style={styles.earning}>
						<Text variant="uiStrong" weight="bold" accessibilityRole="header" style={styles.sectionTitle}>
							Your earning
						</Text>
						<View style={styles.earningRow}>
							<Text variant="ui" color="ink600">{`Earning, ${receipt.earning.status}`}</Text>
							<Text variant="uiStrong" color="green700" weight="bold">
								{money(receipt.earning.amount)}
							</Text>
						</View>
					</View>
				) : null}
			</Section>
		</View>
	);
}

const styles = StyleSheet.create({
	sheet: {
		backgroundColor: color.surface,
		borderWidth: 1,
		borderColor: color.line,
		borderRadius: radius.lg,
		overflow: "hidden",
	},
	head: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		gap: space[3],
		padding: space[4],
	},
	headRight: { alignItems: "flex-end", flexShrink: 1 },
	sectionLine: { borderBottomWidth: 1, borderBottomColor: color.line },
	gridRow: { flexDirection: "row" },
	gridTop: { borderTopWidth: 1, borderTopColor: color.line },
	cell: { flex: 1, paddingHorizontal: space[4], paddingVertical: space[3] },
	cellRight: { borderLeftWidth: 1, borderLeftColor: color.line },
	field: { gap: 4 },
	fields: { gap: space[4] },
	section: { padding: space[4] },
	sectionTitle: { marginBottom: space[1] },
	total: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "baseline",
		paddingHorizontal: space[4],
		paddingVertical: space[4],
		backgroundColor: color.subtle,
	},
	earning: { marginTop: space[5] },
	earningRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
});

export default ReceiptBody;
