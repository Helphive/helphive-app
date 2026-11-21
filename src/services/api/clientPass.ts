import { Platform } from "react-native";
import * as AppIntegrity from "@expo/app-integrity";
import { baseURL } from "@/services/api/baseURL";
import { attestRequestHash } from "@/services/api/attestHash";
import { setClientHeaders } from "@/services/api/clientHeaders";
import { getDeviceId, getStoredClientPass, storeClientPass } from "@/services/secureStore";

/**
 * The client pass: a short-lived token from POST /client-attest proving this is the genuine app (Play Integrity) on a
 * genuine device. Sent as X-Client-Pass on every API request. Getting one never throws and never holds a request for
 * long: without a pass the request goes out without the header and the server decides (it may answer 428).
 */
interface Pass {
	pass: string;
	expiresAt: number;
}

const PROJECT_NUMBER = process.env.EXPO_PUBLIC_PLAY_INTEGRITY_PROJECT_NUMBER || "1034719046291";
const REFRESH_MARGIN_MS = 2 * 60 * 1000;
const PAUSE_AFTER_FAILURE_MS = 60 * 1000;
const ATTEST_TIMEOUT_MS = 15 * 1000;
const RETRYABLE = [
	"NETWORK_ERROR",
	"TOO_MANY_REQUESTS",
	"GOOGLE_SERVER_UNAVAILABLE",
	"CLIENT_TRANSIENT_ERROR",
	"INTERNAL_ERROR",
];

let cache: Pass | null = null;
let storedLoad: Promise<void> | null = null;
let inFlight: Promise<Pass | null> | null = null;
let pausedUntil = 0;
let mintedAt = 0;
let providerPrepared: Promise<void> | null = null;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const errorCode = (e: unknown) => String((e as { code?: string })?.code ?? (e as Error)?.message ?? "");

const prepareProvider = () => (providerPrepared ??= AppIntegrity.prepareIntegrityTokenProviderAsync(PROJECT_NUMBER));

/** A Play Integrity token bound to this device id, or null. Prepares the provider again once if it was dropped, and retries a transient error once. */
const integrityToken = async (deviceId: string): Promise<string | null> => {
	const requestHash = attestRequestHash(deviceId);
	let reprepared = false;
	let retried = false;
	for (;;) {
		try {
			await prepareProvider();
			return await AppIntegrity.requestIntegrityCheckAsync(requestHash);
		} catch (e) {
			providerPrepared = null;
			const code = errorCode(e);
			if (!reprepared && /ERR_APP_INTEGRITY_PROVIDER_(INVALID|NOT_PREPARED)/.test(code)) reprepared = true;
			else if (!retried && RETRYABLE.some((c) => code.includes(`ERR_APP_INTEGRITY_${c}`))) {
				retried = true;
				await sleep(2000);
			} else return null;
		}
	}
};

const attest = async (): Promise<Pass | null> => {
	const deviceId = await getDeviceId();
	if (!deviceId) return null;
	const debugToken = process.env.EXPO_PUBLIC_ATTEST_DEBUG_TOKEN;
	let proof: Record<string, string>;
	if (debugToken) proof = { debugToken };
	else if (Platform.OS === "android") {
		const token = await integrityToken(deviceId);
		if (!token) return null;
		proof = { integrityToken: token };
	} else return null;

	const headers = new Headers({ "content-type": "application/json" });
	await setClientHeaders(headers);
	const response = await fetch(`${baseURL}/client-attest`, {
		method: "POST",
		headers,
		body: JSON.stringify({ platform: Platform.OS, deviceId, ...proof }),
	});
	if (!response.ok) return null;
	const body = await response.json();
	return typeof body?.pass === "string" && typeof body?.expiresAt === "number"
		? { pass: body.pass, expiresAt: body.expiresAt }
		: null;
};

/** One attestation at a time; a failure (or a timeout) pauses further attempts for 60 s. */
const mint = (): Promise<Pass | null> =>
	(inFlight ??= Promise.race([attest(), sleep(ATTEST_TIMEOUT_MS).then(() => null)])
		.catch(() => null)
		.then(async (result) => {
			if (result) {
				cache = result;
				mintedAt = Date.now();
				await storeClientPass(result);
			} else pausedUntil = Date.now() + PAUSE_AFTER_FAILURE_MS;
			return result;
		})
		.finally(() => {
			inFlight = null;
		}));

const freshPass = () => (cache && cache.expiresAt - Date.now() > REFRESH_MARGIN_MS ? cache.pass : null);
const usablePass = () => (cache && cache.expiresAt > Date.now() ? cache.pass : null);

/** The pass to send, minting a new one when none is stored or less than 2 minutes remain. Null when there is none. */
export const getClientPass = async (): Promise<string | null> => {
	try {
		storedLoad ??= getStoredClientPass().then((stored) => {
			cache ??= stored;
		});
		await storedLoad;
		const pass = freshPass();
		if (pass) return pass;
		if (Date.now() < pausedUntil) return usablePass();
		return (await mint())?.pass ?? usablePass();
	} catch {
		return null;
	}
};

/** After a 428: drop the cached pass and attest again now, ignoring the 60 s pause. */
export const forceReattest = async (): Promise<string | null> => {
	try {
		// Several requests get a 428 together: the first one mints, the rest reuse that pass instead of minting again.
		if (freshPass() && Date.now() - mintedAt < 10_000) return freshPass();
		cache = null;
		pausedUntil = 0;
		void storeClientPass(null);
		return (await mint())?.pass ?? null;
	} catch {
		return null;
	}
};

/** Adds X-Client-Pass to a request's headers when there is a pass. */
export const setClientPass = async (headers: Headers) => {
	const pass = await getClientPass();
	if (pass) headers.set("x-client-pass", pass);
	return headers;
};

/** True for the server's "send a client pass" answer: 428 with { code: "CLIENT_PASS_REQUIRED" }. */
export const isClientPassRequired = (status: unknown, data: unknown) =>
	status === 428 && (data as { code?: string } | null | undefined)?.code === "CLIENT_PASS_REQUIRED";
