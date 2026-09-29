import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { BookingReceipt } from "../../features/receipt/receiptApiSlice";
import { formatDate, formatDateTime, formatMoney, getDisplayStatus } from "../../utils/format";
import { useAppTheme } from "../../utils/theme";
import Timeline from "../details/Timeline";
import { buildBookingTimeline } from "../details/bookingTimeline";
import { CARD_BORDER, TEXT_STRONG } from "../details/tokens";
import ReceiptHeader from "./ReceiptHeader";
import { paymentLabel } from "./receiptText";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
	const theme = useAppTheme();
	return (
		<View style={{ paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: CARD_BORDER }}>
			<Text
				style={{
					fontFamily: theme.colors.fontSemiBold,
					color: theme.colors.bodyColor,
					fontSize: 12,
					letterSpacing: 0.6,
					textTransform: "uppercase",
					marginBottom: 10,
				}}
			>
				{title}
			</Text>
			{children}
		</View>
	);
};

const Row = ({
	label,
	value,
	strong,
	tone,
}: {
	label: string;
	value: string;
	strong?: boolean;
	tone?: "good" | "bad";
}) => {
	const theme = useAppTheme();
	return (
		<View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, gap: 12 }}>
			<Text style={{ color: theme.colors.bodyColor, fontFamily: theme.colors.fontRegular }}>{label}</Text>
			<Text
				style={{
					flexShrink: 1,
					textAlign: "right",
					fontFamily: strong ? theme.colors.fontBold : theme.colors.fontMedium,
					color: tone === "good" ? "#067647" : tone === "bad" ? "#B42318" : TEXT_STRONG,
				}}
			>
				{value}
			</Text>
		</View>
	);
};

const ReceiptBody = ({ receipt }: { receipt: BookingReceipt }) => {
	const theme = useAppTheme();
	const money = (value: number) => formatMoney(value, receipt.currency);
	const payment = receipt.payment;
	const status = getDisplayStatus({
		status: receipt.status,
		providerId: receipt.provider,
		startDate: receipt.startDate,
	});
	const refunded = !!payment?.refundStatus;

	return (
		<View
			style={{
				backgroundColor: theme.colors.surface,
				borderRadius: 16,
				borderWidth: 1,
				borderColor: CARD_BORDER,
				overflow: "hidden",
			}}
		>
			<ReceiptHeader receiptNumber={receipt.receiptNumber} issuedAt={receipt.issuedAt} status={status} />

			<View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
				<Text style={{ fontFamily: theme.colors.fontBold, fontSize: 18, color: TEXT_STRONG }}>
					{receipt.service?.name}
				</Text>
				<Text style={{ color: theme.colors.bodyColor, marginTop: 2 }}>{formatDateTime(receipt.startDate)}</Text>
				<View style={{ marginTop: 12 }}>
					<Row
						label={`${money(receipt.rate)} x ${receipt.hours} ${receipt.hours === 1 ? "hr" : "hrs"}`}
						value={money(receipt.subtotal)}
					/>
					<Row label="Subtotal" value={money(receipt.subtotal)} />
				</View>
				<View style={{ height: 1, backgroundColor: CARD_BORDER, marginVertical: 8 }} />
				<Row label="Total" value={money(receipt.total)} strong />
			</View>

			<Section title="Payment">
				<Row
					label="Status"
					value={paymentLabel(receipt)}
					tone={payment?.status === "completed" && !refunded ? "good" : undefined}
				/>
				{!!payment && <Row label="Amount" value={money(payment.amount)} />}
				{!!payment?.paidAt && <Row label="Paid on" value={formatDateTime(payment.paidAt)} />}
				{refunded && (
					<>
						<Row label="Refunded" value={money(payment?.refundAmount ?? 0)} tone="bad" />
						{!!payment?.refundedAt && (
							<Row label="Refunded on" value={formatDateTime(payment.refundedAt)} />
						)}
					</>
				)}
			</Section>

			{!!receipt.earning && (
				<Section title="Your earning">
					<Row label="Amount" value={money(receipt.earning.amount)} strong tone="good" />
					<Row
						label="Status"
						value={receipt.earning.status.charAt(0).toUpperCase() + receipt.earning.status.slice(1)}
					/>
				</Section>
			)}

			<Section title="Customer and provider">
				<Row label="Customer" value={receipt.customer?.name || "—"} />
				{!!receipt.customer?.email && <Row label="Email" value={receipt.customer.email} />}
				<Row label="Provider" value={receipt.provider?.name || "Not assigned yet"} />
			</Section>

			<Section title="Address">
				<Text style={{ color: TEXT_STRONG, fontFamily: theme.colors.fontMedium }}>
					{receipt.address || "—"}
				</Text>
			</Section>

			<Section title="Timeline">
				<Timeline
					steps={buildBookingTimeline({
						status: receipt.status,
						hasProvider: !!receipt.provider,
						startedAt: receipt.startedAt,
						completedAt: receipt.completedAt,
						cancelledAt: receipt.cancelledAt,
						cancellationReason: receipt.cancellationReason,
					})}
				/>
			</Section>

			<View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
				<Text style={{ color: theme.colors.bodyColor, fontSize: 12, textAlign: "center" }}>
					Booking {receipt.bookingId.slice(-8).toUpperCase()} - issued {formatDate(receipt.issuedAt)}
				</Text>
			</View>
		</View>
	);
};

export default ReceiptBody;
