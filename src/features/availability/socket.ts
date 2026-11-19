// Client side of the provider availability websocket (see the backend's provider-websocket-auth.ts).
// Protocol: connect to /provider-availability, send { type: "auth", token } first, send availability messages only
// after { type: "auth_ok" }. Close code 4401 means the token was rejected; 4429 means too many messages.
// Kept free of React, Redux and react-native imports so it can be unit tested with a fake socket.
import type { RefreshOutcome } from "@/services/api/apiSlice";

export const WS_CLOSE_UNAUTHORIZED = 4401;
export const WS_CLOSE_RATE_LIMITED = 4429;

const MAX_CONSECUTIVE_FAILURES = 5;
const MAX_CONSECUTIVE_AUTH_FAILURES = 3;
const MAX_BACKOFF_MS = 15000;
const RATE_LIMIT_BACKOFF_MS = 5000;
const OPEN = 1;

export interface AvailabilityPayload {
	isProviderAvailable: boolean;
	latitude: number | null;
	longitude: number | null;
	selectedJobs: number[];
}

export interface SocketLike {
	readyState: number;
	send(data: string): void;
	close(code?: number): void;
	onopen: ((event: any) => void) | null;
	onmessage: ((event: { data: any }) => void) | null;
	onclose: ((event: { code?: number }) => void) | null;
	onerror: ((event: any) => void) | null;
}

export interface AvailabilitySocketDeps {
	url: string;
	createSocket: (url: string) => SocketLike;
	/** The current access token from the store. */
	getToken: () => string | null;
	/** Gets a fresh access token through the API layer's single in-flight refresh. */
	refreshToken: () => Promise<RefreshOutcome>;
	/** Too many failed attempts in a row; the socket has been stopped. */
	onGiveUp: () => void;
	/** The refresh was rejected, so the session is over (the API layer has already signed the user out). */
	onSessionEnded?: () => void;
	/** The server rejected an availability message or failed to save it. */
	onServerError?: (message: string) => void;
	now?: () => number;
}

/** True when the token's `exp` is in the past (or within a few seconds). An unreadable token counts as not expired. */
export const isTokenExpired = (token: string, nowMs: number = Date.now(), skewMs = 15000): boolean => {
	try {
		const payload = token.split(".")[1];
		const decode = (globalThis as any).atob as ((s: string) => string) | undefined;
		if (!payload || !decode) return false;
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		const { exp } = JSON.parse(decode(base64 + "=".repeat((4 - (base64.length % 4)) % 4)));
		return typeof exp === "number" && exp * 1000 - skewMs <= nowMs;
	} catch {
		return false;
	}
};

export const buildAvailabilityMessage = (p: AvailabilityPayload): string =>
	JSON.stringify({
		isProviderAvailable: p.isProviderAvailable,
		currentLocation: { latitude: p.latitude, longitude: p.longitude },
		selectedJobs: p.selectedJobs,
	});

/**
 * One availability socket at a time. start() opens it, stop() closes it for good; update() records the latest
 * availability, which is sent once the server has acknowledged auth (only the latest state matters, so anything
 * set before the acknowledgement is coalesced rather than queued message by message).
 */
export class AvailabilitySocket {
	private socket: SocketLike | null = null;
	private running = false;
	private authenticated = false;
	private refreshing = false;
	private timer: ReturnType<typeof setTimeout> | null = null;
	private failures = 0;
	private authFailures = 0;
	// Bumped by start() and stop() so a refresh that finishes after a stop does not reconnect.
	private epoch = 0;
	private latest: string | null = null;
	private lastSent: string | null = null;
	private tokenUsed: string | null = null;

	constructor(private readonly deps: AvailabilitySocketDeps) {}

	start(initial?: AvailabilityPayload) {
		if (this.running) return;
		this.running = true;
		this.epoch += 1;
		this.failures = 0;
		this.authFailures = 0;
		if (initial) this.latest = buildAvailabilityMessage(initial);
		this.connect();
	}

	stop() {
		this.running = false;
		this.epoch += 1;
		this.refreshing = false;
		this.authenticated = false;
		this.lastSent = null;
		if (this.timer) clearTimeout(this.timer);
		this.timer = null;
		const socket = this.socket;
		this.socket = null;
		if (socket) {
			socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
			try {
				socket.close(1000);
			} catch {
				// Already closed.
			}
		}
	}

	update(payload: AvailabilityPayload) {
		this.latest = buildAvailabilityMessage(payload);
		this.flush();
	}

	/** The app came back to the foreground: reconnect now instead of waiting out a back-off, if nothing is in flight. */
	resume() {
		if (!this.running || this.socket || this.refreshing) return;
		if (this.timer) clearTimeout(this.timer);
		this.timer = null;
		this.connect();
	}

	get isRunning() {
		return this.running;
	}

	private flush() {
		if (!this.authenticated || !this.latest || this.latest === this.lastSent) return;
		if (this.socket?.readyState !== OPEN) return;
		this.socket.send(this.latest);
		this.lastSent = this.latest;
	}

	private connect() {
		if (!this.running || this.socket || this.refreshing) return;
		const token = this.deps.getToken();
		if (!token || isTokenExpired(token, this.deps.now?.())) {
			this.refreshThenConnect();
			return;
		}
		this.open(token);
	}

	private open(token: string) {
		this.tokenUsed = token;
		this.authenticated = false;
		this.lastSent = null;
		const socket = this.deps.createSocket(this.deps.url);
		this.socket = socket;
		socket.onopen = () => {
			if (this.socket !== socket) return;
			socket.send(JSON.stringify({ type: "auth", token }));
		};
		socket.onmessage = (event) => {
			if (this.socket !== socket) return;
			this.handleMessage(event.data);
		};
		socket.onerror = () => undefined; // onclose always follows and decides what to do.
		socket.onclose = (event) => {
			if (this.socket !== socket) return;
			this.socket = null;
			this.authenticated = false;
			this.lastSent = null;
			if (!this.running) return;
			if (event?.code === WS_CLOSE_UNAUTHORIZED) this.handleUnauthorized();
			else this.scheduleReconnect(event?.code === WS_CLOSE_RATE_LIMITED ? RATE_LIMIT_BACKOFF_MS : 0);
		};
	}

	private handleMessage(raw: unknown) {
		let message: any;
		try {
			message = JSON.parse(String(raw));
		} catch {
			return;
		}
		if (message?.type === "auth_ok") {
			this.authenticated = true;
			this.failures = 0;
			this.authFailures = 0;
			this.flush();
		} else if (message?.type === "error" && message.code === undefined && message.error) {
			// A rejected or failed availability message; the socket stays open. Coded errors precede a close.
			this.deps.onServerError?.(String(message.error));
		}
	}

	private handleUnauthorized() {
		this.authFailures += 1;
		if (this.authFailures > MAX_CONSECUTIVE_AUTH_FAILURES) {
			this.giveUp();
			return;
		}
		// Someone else (a REST call) may already have refreshed the token since this socket authenticated.
		if (this.deps.getToken() !== this.tokenUsed) this.connect();
		else this.refreshThenConnect();
	}

	private refreshThenConnect() {
		if (this.refreshing) return;
		this.refreshing = true;
		const epoch = this.epoch;
		this.deps
			.refreshToken()
			.catch((): RefreshOutcome => "failed")
			.then((outcome) => {
				if (epoch !== this.epoch) return;
				this.refreshing = false;
				if (outcome === "ended") {
					this.stop();
					this.deps.onSessionEnded?.();
				} else if (outcome === "failed") {
					this.scheduleReconnect();
				} else {
					this.connect();
				}
			});
	}

	private scheduleReconnect(minDelayMs = 0) {
		if (this.timer) return;
		this.failures += 1;
		if (this.failures > MAX_CONSECUTIVE_FAILURES) {
			this.giveUp();
			return;
		}
		const delay = Math.max(minDelayMs, Math.min(1000 * 2 ** (this.failures - 1), MAX_BACKOFF_MS));
		this.timer = setTimeout(() => {
			this.timer = null;
			this.connect();
		}, delay);
	}

	private giveUp() {
		this.stop();
		this.deps.onGiveUp();
	}
}
