import type { DisplayStatus } from "@/lib/format";

/** The other party of a booking: the server sends only these fields, and only when it populated the reference. */
export interface Counterparty {
	_id: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	/** Bucket path; build a URL with profileImageUrl(). */
	profile?: string;
	rating?: number;
}

/** A booking as the provider endpoints return it (`withDisplayStatus`, and `withCounterparties` where populated). */
export interface Booking {
	_id: string;
	status: "pending" | "in progress" | "completed" | "cancelled";
	displayStatus?: DisplayStatus;
	/** An id string when not populated (my-orders), an object when populated, null when unassigned. */
	userId: string | Counterparty | null;
	providerId: string | Counterparty | null;
	service: { id: number; name: string };
	rate: number;
	hours: number;
	startDate: string;
	address: string;
	latitude?: number;
	longitude?: number;
	userApprovalRequested?: boolean;
	createdAt?: string;
	acceptedAt?: string | null;
	startRequestedAt?: string | null;
	startedAt?: string | null;
	completedAt?: string | null;
	cancelledAt?: string | null;
	cancellationReason?: string;
	/** "HH-" plus the last 8 hex digits of the id; absent on older bookings. */
	reference?: string;
	location?: { placeName?: string | null } | null;
}

export interface OpenOrdersResponse {
	paidBookings: Booking[];
}

export interface BookingDetailsResponse {
	booking: Booking;
}

export interface Earning {
	_id: string;
	bookingId: string;
	amount: number;
	date: string;
	status: "pending" | "completed" | "cancelled";
	completionDate?: string | null;
}

export interface Payout {
	_id: string;
	amount: number;
	currency?: string;
	status: "pending" | "in_transit" | "paid" | "failed" | "cancelled";
	createdAt: string;
	destinationDetails?: { type?: string; last4?: string } | null;
}

export interface EarningsResponse {
	availableBalance: number;
	earnings: Earning[];
	payouts: Payout[];
	/** Added by newer servers: when earnings are released and whether Stripe is in test mode. */
	releasePolicy?: { delaySeconds: number; testMode: boolean; notice: string };
}

export const isCounterparty = (value: Booking["userId"]): value is Counterparty =>
	typeof value === "object" && value !== null;
