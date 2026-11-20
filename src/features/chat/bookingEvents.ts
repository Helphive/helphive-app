// Booking events in the conversation: the pure rules (no React, no SDK, no dates library), so they can be run on their
// own. Same rules and exports as the web (helphive-web src/features/chat/ui/bookingEvents.ts); contract (normative,
// with the truth table): scratch/chat-cards/contract.md.
//
// A booking event message is text with metadata `helphive = { v: 1, kind: "booking_event", event, bookingId }`. Anyone
// can send such a message, so the message alone proves nothing: it is rendered as an event only when the booking's own
// data (loaded through the API for this viewer) confirms the event. Everything shown comes from the booking or from
// constants here; no text of the message is ever shown with system styling.
import type { DisplayStatus } from "@/lib/format";

export const BOOKING_EVENTS = ["accepted", "started", "completed", "cancelled"] as const;
export type BookingEvent = (typeof BOOKING_EVENTS)[number];

/** The only version this client can read. */
export const KNOWN_VERSION = 1;

/** The fixed sentence of each event (the server's text, and what an old app shows). A message must carry exactly it. */
export const EVENT_TEXT: Record<BookingEvent, string> = {
	accepted: "A booking was accepted.",
	started: "The job has started.",
	completed: "The job was completed.",
	cancelled: "The booking was cancelled.",
};

/** What the server sent before the metadata existed (people's history still has it). */
export const LEGACY_ACCEPTED_TEXT = EVENT_TEXT.accepted;
export const LEGACY_MATCH_WINDOW_MS = 5 * 60 * 1000;

const OBJECT_ID = /^[a-f\d]{24}$/i;

export interface EventMessage {
	key: string;
	id?: number;
	sentAt: number;
	kind: string;
	text?: string;
	/** `metadata.helphive` of the message, as it came (unchecked). */
	helphive?: unknown;
}

/**
 * A booking as both of the app's booking lists return it (customer `user/bookings`, provider `provider/my-orders`):
 * only the fields the rules and the cards read.
 */
export interface PairBooking {
	_id: string;
	status: string;
	displayStatus?: DisplayStatus;
	providerId?: unknown;
	userId?: unknown;
	service?: { id?: number; name?: string } | null;
	startDate: string;
	hours: number;
	userApprovalRequested?: boolean;
	acceptedAt?: string | null;
	startedAt?: string | null;
	completedAt?: string | null;
	cancelledAt?: string | null;
}

/** The fields of a booking the rules read (the pair's bookings come from the viewer's own booking lists). */
export type BookingFacts = Pick<
	PairBooking,
	"_id" | "status" | "displayStatus" | "providerId" | "acceptedAt" | "startedAt" | "completedAt" | "cancelledAt"
>;

const isEvent = (v: unknown): v is BookingEvent => (BOOKING_EVENTS as readonly unknown[]).includes(v);

/** What a message claims to be, from its own content only (rule 1, the parts that need no booking). */
export type Claim = { type: "event"; event: BookingEvent; bookingId: string } | { type: "legacy" };

/**
 * The claim of a text message: metadata exactly `{v: 1, kind: "booking_event", event, bookingId: 24 hex}` with the
 * event's exact fixed sentence; or no metadata and exactly the legacy sentence. Anything else is no claim (a bubble).
 */
export const claimOf = (m: EventMessage): Claim | null => {
	if (m.kind !== "text") return null;
	const h = m.helphive as { v?: unknown; kind?: unknown; event?: unknown; bookingId?: unknown } | undefined | null;
	if (h === undefined || h === null) {
		return m.text === LEGACY_ACCEPTED_TEXT ? { type: "legacy" } : null;
	}
	if (typeof h !== "object" || h.kind !== "booking_event" || h.v !== KNOWN_VERSION) return null;
	if (!isEvent(h.event) || typeof h.bookingId !== "string" || !OBJECT_ID.test(h.bookingId)) {
		return null;
	}
	return m.text === EVENT_TEXT[h.event] ? { type: "event", event: h.event, bookingId: h.bookingId } : null;
};

/** The booking this legacy message belongs to: closest `acceptedAt` to the message time, within 5 minutes; or null. */
export const matchLegacyAccepted = (
	sentAt: number,
	bookings: readonly Pick<PairBooking, "_id" | "acceptedAt">[],
): string | null => {
	let best: { id: string; gap: number } | null = null;
	for (const b of bookings) {
		const at = b.acceptedAt ? Date.parse(b.acceptedAt) : NaN;
		if (!Number.isFinite(at)) continue;
		const gap = Math.abs(at - sentAt);
		if (gap <= LEGACY_MATCH_WINDOW_MS && (!best || gap < best.gap)) best = { id: b._id, gap };
	}
	return best?.id ?? null;
};

/**
 * Whether the booking's own state shows the event really happened (rule 1).
 * accepted: it has a provider. started: it has `startedAt`, or is or was in progress (`status` in progress or
 * completed). completed: `status` completed. cancelled: `status` cancelled (or displayStatus cancelled) with a provider.
 */
export const bookingConfirms = (event: BookingEvent, b: BookingFacts): boolean => {
	if (!b.providerId) return false;
	switch (event) {
		case "accepted":
			return true;
		case "started":
			return !!b.startedAt || b.status === "in progress" || b.status === "completed";
		case "completed":
			return b.status === "completed" || b.displayStatus === "completed";
		case "cancelled":
			return b.status === "cancelled" || b.displayStatus === "cancelled";
	}
};

/** The booking's own time of that stage, or null when the API has none (then the message's sent time is used). */
export const stageTime = (event: BookingEvent, b: BookingFacts): number | null => {
	const iso = {
		accepted: b.acceptedAt,
		started: b.startedAt,
		completed: b.completedAt,
		cancelled: b.cancelledAt,
	}[event];
	const t = iso ? Date.parse(iso) : NaN;
	return Number.isFinite(t) ? t : null;
};

/** The booking and event a message is confirmed as (rules 1 and 5), or null. The list preview uses it too. */
export const confirmedEvent = <B extends BookingFacts>(
	m: EventMessage,
	bookings: readonly B[],
): { event: BookingEvent; booking: B; legacy: boolean } | null => {
	const claim = claimOf(m);
	if (!claim) return null;
	const id = claim.type === "event" ? claim.bookingId : matchLegacyAccepted(m.sentAt, bookings);
	const booking = id ? bookings.find((b) => b._id === id) : undefined;
	const event = claim.type === "event" ? claim.event : "accepted";
	return booking && bookingConfirms(event, booking) ? { event, booking, legacy: claim.type === "legacy" } : null;
};

/* ---------- The stream: what the message list renders ---------- */

export interface EventLine {
	key: string;
	event: BookingEvent;
	at: number;
}

export type StreamItem<M extends EventMessage> =
	/** An ordinary message bubble from its sender (also everything that fails the rule). */
	| { type: "message"; key: string; m: M }
	/** A legacy "A booking was accepted." that matches no booking: the fixed sentence as a neutral line. */
	| { type: "line"; key: string; m: M }
	| {
			type: "event";
			key: string;
			bookingId: string;
			/** full: the card; compact: one row (a later event of a booking that already has its card). */
			variant: "full" | "compact";
			lines: EventLine[];
			/** Where the day heading goes: the first message of the group. */
			first: M;
			loading: boolean;
	  };

/**
 * Turns the loaded messages (oldest first) into render items. A message that claims to be an event shows as one only
 * once the pair's bookings are loaded and confirm it (skeleton until then); otherwise it is an ordinary bubble.
 * Consecutive confirmed events of one booking become one item with a line each; only the first item of a booking is a
 * full card, later ones are compact rows; a second message for the same (booking, event) renders nothing.
 */
export const buildStream = <M extends EventMessage>(
	messages: readonly M[],
	bookings: readonly BookingFacts[],
	loaded: boolean,
): StreamItem<M>[] => {
	const out: StreamItem<M>[] = [];
	const carded = new Set<string>();
	const seen = new Set<string>();
	let open: Extract<StreamItem<M>, { type: "event" }> | null = null;
	for (const m of messages) {
		const claim = claimOf(m);
		if (!claim) {
			open = null;
			out.push({ type: "message", key: m.key, m });
			continue;
		}
		if (!loaded) {
			// Whether it is an event depends on the booking: a skeleton of the card's size until it is known.
			open = null;
			out.push({ type: "event", key: m.key, bookingId: "", variant: "full", lines: [], first: m, loading: true });
			continue;
		}
		const confirmed = confirmedEvent(m, bookings);
		if (!confirmed) {
			open = null;
			out.push(claim.type === "legacy" ? { type: "line", key: m.key, m } : { type: "message", key: m.key, m });
			continue;
		}
		const bookingId = confirmed.booking._id;
		const once = `${bookingId}:${confirmed.event}`;
		if (seen.has(once)) continue; // a replay: nothing
		seen.add(once);
		const line: EventLine = {
			key: m.key,
			event: confirmed.event,
			at: stageTime(confirmed.event, confirmed.booking) ?? m.sentAt,
		};
		if (open && open.bookingId === bookingId) {
			open.lines.push(line);
			continue;
		}
		open = {
			type: "event",
			key: m.key,
			bookingId,
			variant: carded.has(bookingId) ? "compact" : "full",
			lines: [line],
			first: m,
			loading: false,
		};
		carded.add(bookingId);
		out.push(open);
	}
	return out;
};

/* ---------- Wording ---------- */

export const EVENT_TITLE: Record<BookingEvent, string> = {
	accepted: "Booking accepted",
	started: "Job started",
	completed: "Job completed",
	cancelled: "Booking cancelled",
};

/** Conversation list preview of an event message: "Booking accepted · Public Area Attendant". */
export const eventPreview = (event: BookingEvent | null, service?: string | null, fallback = "") => {
	if (!event) return fallback;
	return service ? `${EVENT_TITLE[event]} · ${service}` : EVENT_TITLE[event];
};

/* ---------- Booking display status, order and groups ---------- */

const HOUR = 3_600_000;

export type BookingLike = Pick<
	PairBooking,
	| "_id"
	| "status"
	| "displayStatus"
	| "startDate"
	| "hours"
	| "userApprovalRequested"
	| "completedAt"
	| "cancelledAt"
	| "startedAt"
	| "acceptedAt"
>;

/** The server's displayStatus; for a booking without it, derived from the stored status like the server does. */
export const displayStatusOf = (
	b: Pick<PairBooking, "status" | "displayStatus" | "userApprovalRequested">,
): DisplayStatus => {
	if (b.displayStatus) return b.displayStatus;
	if (b.status === "completed") return "completed";
	if (b.status === "cancelled") return "cancelled";
	if (b.status === "in progress") return "in_progress";
	return b.userApprovalRequested ? "awaiting_start_approval" : "accepted";
};

const start = (b: Pick<PairBooking, "startDate">) => Date.parse(b.startDate);
const end = (b: Pick<PairBooking, "startDate" | "hours">) => start(b) + (b.hours || 0) * HOUR;
const finishedAt = (b: Pick<PairBooking, "startDate" | "completedAt" | "cancelledAt">) =>
	Math.max(
		b.completedAt ? Date.parse(b.completedAt) : 0,
		b.cancelledAt ? Date.parse(b.cancelledAt) : 0,
		start(b) || 0,
	);

/**
 * The booking the header row shows: in progress, then accepted and still to come (soonest first), then awaiting start
 * approval, then the most recently finished (completed, cancelled; also an accepted booking whose shift is over).
 */
export const mostRelevantBooking = <B extends BookingLike>(bookings: readonly B[], now: number): B | null => {
	const rank = (b: B) => {
		const s = displayStatusOf(b);
		if (s === "in_progress") return 0;
		if (s === "accepted" && end(b) > now) return 1;
		if (s === "awaiting_start_approval") return 2;
		return 3;
	};
	const sorted = [...bookings].sort((a, b) => {
		const ra = rank(a);
		const rb = rank(b);
		if (ra !== rb) return ra - rb;
		if (ra === 1 || ra === 2) return start(a) - start(b);
		if (ra === 0) return start(b) - start(a);
		return finishedAt(b) - finishedAt(a);
	});
	return sorted[0] ?? null;
};

/** The timeline's two groups, each newest first: "Active and upcoming" then "Past". */
export const timelineGroups = <B extends BookingLike>(bookings: readonly B[], now: number) => {
	const active: B[] = [];
	const past: B[] = [];
	for (const b of bookings) {
		const s = displayStatusOf(b);
		const isActive = s === "in_progress" || s === "awaiting_start_approval" || (s === "accepted" && end(b) > now);
		(isActive ? active : past).push(b);
	}
	const newest = (a: B, b: B) => start(b) - start(a);
	return { active: active.sort(newest), past: past.sort(newest) };
};

export type StageState = "done" | "current" | "todo" | "cancelled";

/** The booking's stages for the progress line: filled up to where it is now; cancelled ends in a red state. */
export function stagesOf(
	b: Pick<PairBooking, "status" | "displayStatus" | "userApprovalRequested" | "startedAt">,
): { label: string; state: StageState }[] {
	const s = displayStatusOf(b);
	if (s === "cancelled") {
		return [
			{ label: "Accepted", state: "done" },
			...(b.startedAt ? [{ label: "Started", state: "done" as const }] : []),
			{ label: "Cancelled", state: "cancelled" },
		];
	}
	const at = s === "completed" ? 3 : s === "in_progress" ? 2 : 1;
	return ["Accepted", "Started", "Completed"].map((label, i) => ({
		label,
		state: i + 1 < at ? "done" : i + 1 === at ? (at === 3 ? "done" : "current") : "todo",
	}));
}

/* ---------- The pair's bookings ---------- */

const idOf = (ref: unknown) =>
	(ref && typeof ref === "object" ? (ref as { _id?: unknown })._id : ref) as string | undefined;

/**
 * The viewer's bookings grouped by the other person (provider for a customer, customer for a provider), only those a
 * provider accepted, each group newest shift first.
 */
export const groupByPerson = <B extends PairBooking>(list: readonly B[], role: "user" | "provider") => {
	const map = new Map<string, B[]>();
	for (const b of list) {
		if (!b.providerId) continue;
		const other = idOf(role === "user" ? b.providerId : b.userId);
		if (!other || typeof other !== "string") continue;
		map.set(other, [...(map.get(other) ?? []), b]);
	}
	map.forEach((bs) => bs.sort((a, b) => start(b) - start(a)));
	return map;
};
