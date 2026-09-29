import { apiSlice } from "../../app/api/apiSlice";

export type BookingReceipt = {
	receiptNumber: string;
	issuedAt: string;
	bookingId: string;
	status: "pending" | "in progress" | "completed" | "cancelled";
	service: { id: number; name: string };
	rate: number;
	hours: number;
	subtotal: number;
	total: number;
	currency: string;
	payment: {
		status: "pending" | "completed" | "cancelled";
		amount: number;
		paidAt: string | null;
		refundStatus: string | null;
		refundAmount: number;
		refundedAt: string | null;
	} | null;
	customer: { name: string; email: string };
	provider: { name: string } | null;
	address: string;
	startDate: string;
	startedAt: string | null;
	completedAt: string | null;
	cancelledAt: string | null;
	cancellationReason: string | null;
	earning: { amount: number; status: string } | null;
};

export const receiptApiSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getBookingReceipt: builder.query<{ receipt: BookingReceipt }, string>({
			query: (bookingId) => ({ url: `booking-receipt/${bookingId}`, method: "GET" }),
		}),
	}),
});

export const { useGetBookingReceiptQuery } = receiptApiSlice;
