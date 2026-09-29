import { BookingReceipt } from "../../features/receipt/receiptApiSlice";
import { formatDate, formatDateTime, formatMoney } from "../../utils/format";

export const paymentLabel = (receipt: BookingReceipt): string => {
	const payment = receipt.payment;
	if (!payment) return "No payment recorded";
	if (payment.refundStatus) {
		const refunded = payment.refundAmount ? ` (${formatMoney(payment.refundAmount, receipt.currency)})` : "";
		return `Refund ${payment.refundStatus}${refunded}`;
	}
	switch (payment.status) {
		case "completed":
			return "Paid";
		case "cancelled":
			return "Cancelled";
		default:
			return "Pending";
	}
};

// Plain-text receipt for the system share sheet.
export const buildReceiptText = (receipt: BookingReceipt): string => {
	const money = (value: number) => formatMoney(value, receipt.currency);
	const lines: string[] = [
		"HelpHive receipt",
		`Receipt ${receipt.receiptNumber}`,
		`Issued ${formatDate(receipt.issuedAt)}`,
		"",
		`Service: ${receipt.service?.name ?? "—"}`,
		`Date: ${formatDateTime(receipt.startDate)}`,
		`Address: ${receipt.address || "—"}`,
		"",
		`Customer: ${receipt.customer?.name ?? "—"}`,
		`Provider: ${receipt.provider?.name ?? "Not assigned"}`,
		"",
		`${money(receipt.rate)} x ${receipt.hours} hr: ${money(receipt.subtotal)}`,
		`Total: ${money(receipt.total)}`,
		`Payment: ${paymentLabel(receipt)}`,
	];
	if (receipt.payment?.paidAt) lines.push(`Paid on: ${formatDateTime(receipt.payment.paidAt)}`);
	if (receipt.payment?.refundedAt) lines.push(`Refunded on: ${formatDateTime(receipt.payment.refundedAt)}`);
	if (receipt.earning) lines.push("", `Your earning: ${money(receipt.earning.amount)} (${receipt.earning.status})`);
	lines.push("", `Booking status: ${receipt.status}`);
	return lines.join("\n");
};
