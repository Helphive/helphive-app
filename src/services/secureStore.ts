import * as SecureStore from "expo-secure-store";

export const storeRefreshToken = async (token: string) => {
	try {
		await SecureStore.setItemAsync("refreshToken", token);
	} catch (error) {
		console.error("Error storing refresh token:", error);
	}
};

export const getRefreshToken = async () => {
	try {
		const token = await SecureStore.getItemAsync("refreshToken");
		return token;
	} catch (error) {
		console.error("Error retrieving refresh token:", error);
		return null;
	}
};

const randomUuid = () => {
	const bytes = new Uint8Array(16);
	const webCrypto = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
	if (webCrypto?.getRandomValues) webCrypto.getRandomValues(bytes);
	else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

let deviceIdPromise: Promise<string | undefined> | null = null;

/** A random id made once and kept in secure storage, sent as X-Device-Id. Undefined when storage fails. */
export const getDeviceId = (): Promise<string | undefined> => {
	if (!deviceIdPromise) {
		deviceIdPromise = (async () => {
			try {
				const existing = await SecureStore.getItemAsync("deviceId");
				if (existing) return existing;
				const created = randomUuid();
				await SecureStore.setItemAsync("deviceId", created);
				return created;
			} catch {
				return undefined;
			}
		})().then((id) => {
			if (!id) deviceIdPromise = null; // try again on a later request
			return id;
		});
	}
	return deviceIdPromise;
};

/** The client pass (see services/api/clientPass.ts) and when it expires, kept so a restart reuses it. */
export const getStoredClientPass = async (): Promise<{ pass: string; expiresAt: number } | null> => {
	try {
		const raw = await SecureStore.getItemAsync("clientPass");
		const stored = raw ? JSON.parse(raw) : null;
		return typeof stored?.pass === "string" && typeof stored?.expiresAt === "number" ? stored : null;
	} catch {
		return null;
	}
};

export const storeClientPass = async (pass: { pass: string; expiresAt: number } | null) => {
	try {
		if (pass) await SecureStore.setItemAsync("clientPass", JSON.stringify(pass));
		else await SecureStore.deleteItemAsync("clientPass");
	} catch {
		// The pass is only a cache.
	}
};

export const deleteRefreshToken = async () => {
	try {
		await SecureStore.deleteItemAsync("refreshToken");
	} catch (error) {
		console.error("Error deleting refresh token:", error);
	}
};
