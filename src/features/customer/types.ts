import type { BookingDisplayStatus } from "@/ui";

/** The other party on a booking, populated only by the detail endpoints (lists carry a bare id). */
export interface BookingPerson {
	_id: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	/** Bucket path; build a URL with profileImageUrl(). */
	profile?: string;
	rating?: number;
}

export type LocationSource = "search" | "map" | "current_location";

/** How the location was picked (contract section 7); null or missing on older bookings. */
export interface BookingLocation {
	placeId?: string | null;
	formattedAddress?: string | null;
	placeName?: string | null;
	source?: LocationSource | null;
	customAddress?: string | null;
	submittedAddress?: string | null;
}

/** A payment as the bookings list returns it. */
export interface BookingPaymentSummary {
	amount: number;
	date?: string;
	status: "pending" | "completed" | "cancelled";
	paymentIntentId?: string;
	clientSecret?: string;
}

/** A payment as get-booking-by-id returns it. A refund exists only when `refundId` is set. */
export interface BookingPayment extends BookingPaymentSummary {
	refundId?: string | null;
	refundStatus?: string | null;
	refundAmount?: number;
	refundCreated?: string | null;
}

export type BookingStatus = "pending" | "in progress" | "completed" | "cancelled";

export interface Booking {
	_id: string;
	userId: BookingPerson | string;
	providerId?: BookingPerson | string | null;
	service: { id: number; name?: string };
	rate: number;
	hours: number;
	startDate: string;
	/** Always the text to show (the customer's own text when they typed one). */
	address: string;
	latitude?: number;
	longitude?: number;
	location?: BookingLocation | null;
	status: BookingStatus;
	displayStatus?: BookingDisplayStatus;
	payments?: BookingPaymentSummary[];
	userApprovalRequested?: boolean;
	acceptedAt?: string | null;
	startedAt?: string | null;
	completedAt?: string | null;
	cancelledAt?: string | null;
	cancellationReason?: string | null;
	createdAt?: string;
}

export interface BookingsResponse {
	history: Booking[];
	active: Booking[];
	scheduled: Booking[];
}

export interface BookingDetailsResponse {
	booking: Booking;
	payment: BookingPayment | null;
}

/** POST /auth/user/create-booking (address fields: scratch/address/address-contract.md section 7). */
export interface CreateBookingRequest {
	service: number;
	rate: number;
	hours: number;
	startAt: string;
	startDate: string;
	startTime: string;
	address: string;
	latitude: number;
	longitude: number;
	placeId?: string;
	formattedAddress?: string;
	placeName?: string;
	locationSource?: LocationSource;
	customAddress?: string;
}

export interface CreateBookingResponse {
	bookingId: string;
	paymentIntentId: string;
	clientSecret: string;
}
