// Starts and stops what belongs to a HelpHive session on this device: push (per-session OneSignal alias) and chat
// (server-issued CometChat token). Follows the auth state, so every way a session starts (sign-in, restored session)
// or ends (sign-out, refresh rejected, ended elsewhere) is covered in one place.
import { AppState } from "react-native";
import store from "@/store";
import { getRefreshToken } from "@/services/secureStore";
import { registerPush, unregisterPush } from "@/services/push";
import { chatRuntime } from "./chatRuntime";

const signedIn = () => !!store.getState().auth.refreshToken;

// Starts and stops run one after another, so a sign-out never interleaves with the next sign-in.
let queue: Promise<unknown> = Promise.resolve();
const enqueue = (task: () => Promise<unknown>) => {
	queue = queue.then(task).catch((error: unknown) => console.log("Session services:", error));
	return queue;
};

const begin = () =>
	enqueue(async () => {
		// Side by side: chat does not wait for push. Then load what the Chat tab shows first.
		await Promise.all([registerPush(), chatRuntime.start()]);
		void chatRuntime.prefetch();
	});

/** Device-side end. The server has already ended the session (or is told separately by endSessionServices). */
const endLocally = () =>
	enqueue(async () => {
		await chatRuntime.signOut({ server: false });
		await unregisterPush({ server: false });
	});

let started = false;

/** Call once at start-up. */
export function startSessionServices() {
	if (started) return;
	started = true;
	let wasSignedIn = signedIn();
	if (wasSignedIn) void begin();
	else {
		// No session to restore: end anything a previous run left behind (chat session, push alias).
		void getRefreshToken().then((token) => {
			if (!token && !signedIn()) void endLocally();
		});
	}
	store.subscribe(() => {
		const now = signedIn();
		if (now === wasSignedIn) return;
		wasSignedIn = now;
		void (now ? begin() : endLocally());
	});
	// Back in the foreground: retry what failed while offline (both are no-ops when already done).
	AppState.addEventListener("change", (next) => {
		if (next === "active" && signedIn()) void begin();
	});
}

/**
 * Explicit sign-out, before POST /auth/logout while the session is still valid: closes the viewing signal, asks the
 * server to stop pushes to this session, and ends chat and OneSignal on the device. The server also revokes the chat
 * token and stops pushes at sign-out, so nothing depends on these calls succeeding.
 */
export const endSessionServices = () =>
	enqueue(async () => {
		await Promise.all([chatRuntime.signOut({ server: true }), unregisterPush({ server: true })]);
	});
