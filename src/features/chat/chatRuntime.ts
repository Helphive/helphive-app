// The CometChat session for the signed-in HelpHive session (scratch/chat/chat-contract.md). Signs in with the token the
// server issues for this session: no Auth Key, presence for friends only, signed out with HelpHive. One instance per
// app run; screens read it with useChatState() and listen to onEvent().
import * as SecureStore from "expo-secure-store";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import store from "@/store";
import { chatApi, type ChatApiError } from "./api";

const USER = CometChat.RECEIVER_TYPE.USER;

/* ---------- Message model used by the screens ---------- */

export type SendState = "sending" | "sent" | "failed";

export interface ChatAttachment {
	url?: string;
	name: string;
	mimeType: string;
}

export interface ChatMessage {
	key: string;
	id?: number;
	muid?: string;
	mine: boolean;
	/** The other person in this one-to-one conversation. */
	peer: string;
	sentAt: number; // ms
	deliveredAt?: number;
	readAt?: number;
	kind: "text" | "image" | "file" | "deleted";
	text?: string;
	attachment?: ChatAttachment;
	state: SendState;
	error?: string;
	/** `metadata.helphive` as received (unchecked): a booking event marker, read only by bookingEvents.ts. */
	helphive?: unknown;
}

/** `metadata.helphive` of a message (from the cache, a page or a live event alike), or undefined. */
function readHelphiveMetadata(m: CometChat.BaseMessage): unknown {
	try {
		const metadata = (m as { getMetadata?: () => unknown }).getMetadata?.();
		return metadata && typeof metadata === "object" ? (metadata as { helphive?: unknown }).helphive : undefined;
	} catch {
		return undefined;
	}
}

const ms = (seconds?: number) => (seconds ? seconds * 1000 : undefined);

// Attachments the server allows (contract section 1); anything else is never linked.
const ALLOWED_TYPES = /^(image\/(jpeg|png|webp|gif|heic|heif)|application\/pdf)$/;
const safeUrl = (url?: string) => (url && /^https:\/\//i.test(url) ? url : undefined);

export function toChatMessage(m: CometChat.BaseMessage, me: string): ChatMessage | null {
	if (m.getReceiverType() !== USER || m.getCategory() !== CometChat.CATEGORY_MESSAGE) return null;
	const senderUid = m.getSender()?.getUid();
	const mine = senderUid === me;
	const peer = mine ? m.getReceiverId() : senderUid;
	if (!peer) return null;
	const base = {
		key: String(m.getId() || m.getMuid()),
		id: m.getId() || undefined,
		muid: m.getMuid() || undefined,
		mine,
		peer,
		sentAt: ms(m.getSentAt()) ?? Date.now(),
		deliveredAt: ms(m.getDeliveredAt()),
		readAt: ms(m.getReadAt()),
		state: "sent" as const,
	};
	if (m.getDeletedAt()) return { ...base, kind: "deleted" };
	const type = m.getType();
	if (type === CometChat.MESSAGE_TYPE.TEXT) {
		return {
			...base,
			kind: "text",
			text: String((m as CometChat.TextMessage).getText() ?? ""),
			helphive: readHelphiveMetadata(m),
		};
	}
	if (type === CometChat.MESSAGE_TYPE.IMAGE || type === CometChat.MESSAGE_TYPE.FILE) {
		const media = m as CometChat.MediaMessage;
		const att = media.getAttachment?.();
		const mimeType = (att?.getMimeType?.() || "").toLowerCase();
		return {
			...base,
			kind: type === CometChat.MESSAGE_TYPE.IMAGE ? "image" : "file",
			text: media.getCaption?.() || undefined,
			attachment: {
				url: ALLOWED_TYPES.test(mimeType) ? safeUrl(att?.getUrl?.()) : undefined,
				name: String(att?.getName?.() || "File").slice(0, 120),
				mimeType,
			},
		};
	}
	return null;
}

/* ---------- State ---------- */

export type ChatStatus = "idle" | "connecting" | "ready" | "unavailable" | "refused" | "error";

export interface Presence {
	online: boolean;
	lastActiveAt?: number; // ms
}

export interface ChatState {
	status: ChatStatus;
	/** What to show when status is not ready (the server's message when it gave one). */
	message?: string;
	me?: string;
	connection: "connected" | "connecting" | "disconnected";
	unread: Record<string, number>;
	typing: Record<string, boolean>;
	presence: Record<string, Presence>;
}

const initial: ChatState = { status: "idle", connection: "connecting", unread: {}, typing: {}, presence: {} };
let state: ChatState = initial;
const stateListeners = new Set<() => void>();

const setState = (patch: Partial<ChatState>) => {
	state = { ...state, ...patch };
	stateListeners.forEach((l) => l());
};

export type ChatEvent =
	| { type: "message"; message: ChatMessage }
	| { type: "receipt"; peer: string; messageId: number; kind: "delivered" | "read"; at: number }
	| { type: "reconnected" };

const eventListeners = new Set<(e: ChatEvent) => void>();
const emit = (e: ChatEvent) => eventListeners.forEach((l) => l(e));

/* ---------- Session ---------- */

const LISTENER = "helphive-app-chat";
// appId and region of the last chat session, so a session left behind (app killed before sign-out) can be ended.
const MARK_KEY = "chatApp";
let initialisedAppId: string | null = null;
let starting: Promise<void> | null = null;
let viewingUid: string | null = null;
// Bumped by sign-out so a sign-in still in flight never completes for a signed-out person.
let generation = 0;
let retryTimer: ReturnType<typeof setTimeout> | undefined;

export const errorCode = (err: unknown) => String((err as { code?: unknown })?.code ?? "");
/** The SDK refused the session: token expired or revoked, or not signed in. */
const isAuthError = (err: unknown) => /AUTH|TOKEN|NOT_LOGGED_IN|USER_NOT_LOGED_IN|UID_NOT_FOUND/i.test(errorCode(err));

/* ---------- Caches ----------
 * What was loaded last, so a screen opens with content while it refreshes. Memory only; emptied at sign-out.
 */
const MAX_CACHED_THREADS = 20;
let conversationsCache: CometChat.Conversation[] | null = null;
let conversationsLoading: Promise<CometChat.Conversation[]> | null = null;
const messagesCache = new Map<string, CometChat.BaseMessage[]>();
// The chat identity the caches belong to. They are open only between that person's sign-in becoming ready and the
// start of sign-out, so nothing loaded for one account can be read, or written late, under another.
let cacheOwner: string | null = null;
let cachesOpen = false;
const cacheUsable = () => cachesOpen && state.status === "ready" && !!state.me && state.me === cacheOwner;

function clearCaches() {
	cachesOpen = false;
	cacheOwner = null;
	conversationsCache = null;
	conversationsLoading = null;
	messagesCache.clear();
}

function openCaches(owner: string) {
	clearCaches();
	cacheOwner = owner;
	cachesOpen = true;
}

/** Keeps the newest page of a conversation (the most recently opened conversations only). */
function rememberMessages(uid: string, page: CometChat.BaseMessage[]) {
	if (!cacheUsable()) return;
	messagesCache.delete(uid);
	messagesCache.set(uid, page.slice());
	const oldest = messagesCache.keys().next().value;
	if (messagesCache.size > MAX_CACHED_THREADS && oldest !== undefined) messagesCache.delete(oldest);
}

/** A cached page follows the conversation as messages arrive, are edited or are deleted. */
function noteMessage(peer: string, raw: CometChat.BaseMessage) {
	if (!cacheUsable()) return;
	const page = messagesCache.get(peer);
	if (!page) return;
	const i = page.findIndex((m) => m.getId() === raw.getId());
	if (i >= 0) page[i] = raw;
	else page.push(raw);
}

async function ensureInit(appId: string, region: string) {
	if (initialisedAppId === appId) return;
	const settings = new CometChat.AppSettingsBuilder()
		.subscribePresenceForFriends()
		.setRegion(region)
		.autoEstablishSocketConnection(true)
		.build();
	await CometChat.init(appId, settings);
	initialisedAppId = appId;
}

function failFromServer(err: unknown) {
	const e = err as ChatApiError;
	if (e?.status === 503) {
		setState({ status: "unavailable", message: "Chat is not available right now." });
	} else if (e?.status === 403) {
		setState({
			status: "refused",
			message:
				e.data?.message ||
				(e.data?.code === "chat_email_unverified"
					? "Verify your email address to use chat."
					: "Chat is turned off for this account."),
		});
	} else if (e?.status === 429) {
		const wait = e.retryAfter ?? 30;
		setState({ status: "error", message: `Too many attempts. Trying again in ${wait} seconds.` });
		retryTimer = setTimeout(() => void chatRuntime.start(), wait * 1000);
	} else {
		setState({ status: "error", message: "Chat could not connect. Check your connection and try again." });
	}
}

function setTyping(uid: string, on: boolean) {
	clearTimeout(typingTimers.get(uid));
	// Safety net for a lost "ended" event.
	if (on)
		typingTimers.set(
			uid,
			setTimeout(() => setTyping(uid, false), 6000),
		);
	if (!!state.typing[uid] !== on) setState({ typing: { ...state.typing, [uid]: on } });
}
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function setPresence(uid: string, presence: Presence) {
	setState({ presence: { ...state.presence, [uid]: presence } });
}

function addListeners(me: string) {
	const onMessage = (m: CometChat.BaseMessage) => {
		const message = toChatMessage(m, me);
		if (!message) return;
		noteMessage(message.peer, m);
		if (!message.mine) {
			CometChat.markAsDelivered(m);
			if (viewingUid !== message.peer) {
				setState({ unread: { ...state.unread, [message.peer]: (state.unread[message.peer] ?? 0) + 1 } });
			}
			setTyping(message.peer, false);
		}
		emit({ type: "message", message });
	};
	const onReceipt = (kind: "delivered" | "read") => (r: CometChat.MessageReceipt) => {
		if (r.getReceiverType() !== USER) return;
		emit({
			type: "receipt",
			peer: r.getSender().getUid(),
			messageId: Number(r.getMessageId()),
			kind,
			at: ms(kind === "read" ? r.getReadAt() : r.getDeliveredAt()) ?? Date.now(),
		});
	};
	const onTyping = (on: boolean) => (t: CometChat.TypingIndicator) => {
		if (t.getReceiverType() === USER) setTyping(t.getSender().getUid(), on);
	};
	CometChat.addMessageListener(
		LISTENER,
		new CometChat.MessageListener({
			onTextMessageReceived: onMessage,
			onMediaMessageReceived: onMessage,
			onMessageDeleted: onMessage,
			onMessageEdited: onMessage,
			onMessagesDelivered: onReceipt("delivered"),
			onMessagesRead: onReceipt("read"),
			onTypingStarted: onTyping(true),
			onTypingEnded: onTyping(false),
		}),
	);
	const onPresence = (online: boolean) => (u: CometChat.User) =>
		setPresence(u.getUid(), { online, lastActiveAt: ms(u.getLastActiveAt()) });
	CometChat.addUserListener(
		LISTENER,
		new CometChat.UserListener({ onUserOnline: onPresence(true), onUserOffline: onPresence(false) }),
	);
	let wasDisconnected = false;
	CometChat.addConnectionListener(
		LISTENER,
		new CometChat.ConnectionListener({
			onConnected: () => {
				setState({ connection: "connected" });
				if (wasDisconnected) {
					wasDisconnected = false;
					void refreshUnread();
					emit({ type: "reconnected" });
				}
			},
			inConnecting: () => setState({ connection: "connecting" }),
			onDisconnected: () => {
				wasDisconnected = true;
				setState({ connection: "disconnected" });
			},
		}),
	);
}

function removeListeners() {
	CometChat.removeMessageListener(LISTENER);
	CometChat.removeUserListener(LISTENER);
	CometChat.removeConnectionListener(LISTENER);
}

async function refreshUnread() {
	try {
		const raw = (await CometChat.getUnreadMessageCountForAllUsers()) as Record<string, unknown>;
		const map = (raw && typeof raw.users === "object" ? raw.users : raw) as Record<string, unknown>;
		const unread: Record<string, number> = {};
		for (const [uid, n] of Object.entries(map ?? {})) {
			if (typeof n === "number" && n > 0 && uid !== viewingUid) unread[uid] = n;
		}
		setState({ unread });
	} catch {
		// Keep the last counts.
	}
}

const requestSession = async () => (await store.dispatch(chatApi.endpoints.createChatSession.initiate()).unwrap()).chat;

async function start() {
	const gen = generation;
	clearTimeout(retryTimer);
	setState({ status: "connecting", message: undefined });
	let chat;
	try {
		chat = await requestSession();
	} catch (err) {
		if (gen === generation) failFromServer(err);
		return;
	}
	try {
		await ensureInit(chat.appId, chat.region);
		await SecureStore.setItemAsync(MARK_KEY, JSON.stringify({ appId: chat.appId, region: chat.region }));
		const current = await CometChat.getLoggedinUser();
		// Reuse the SDK's stored session only when it is this person's current token.
		const same = current && current.getUid() === chat.uid && current.getAuthToken() === chat.authToken;
		if (current && !same) await CometChat.logout();
		if (!same) {
			try {
				await CometChat.login(chat.authToken);
			} catch (err) {
				if (!isAuthError(err)) throw err;
				// Expired or revoked token: ask the server for a new one, once.
				chat = await requestSession();
				await CometChat.login(chat.authToken);
			}
		}
		if (gen !== generation) {
			await CometChat.logout().catch(() => undefined);
			return;
		}
		removeListeners();
		addListeners(chat.uid);
		openCaches(chat.uid);
		setState({ status: "ready", me: chat.uid, connection: "connected" });
		void refreshUnread();
	} catch (err) {
		if (gen !== generation) return;
		setState({
			status: "error",
			message: isAuthError(err)
				? "Chat could not sign you in. Sign out of HelpHive and sign in again."
				: "Chat could not connect. Check your connection and try again.",
		});
	}
}

/**
 * Ends the chat session on this device. `server` also tells the API (closes the viewing signal); call it while the
 * HelpHive session is still valid. The API revokes the token itself at POST /auth/logout.
 */
async function signOut({ server }: { server: boolean }) {
	generation++;
	clearCaches();
	clearTimeout(retryTimer);
	if (viewingUid && server) {
		await store
			.dispatch(chatApi.endpoints.setChatViewing.initiate({ withUid: null }))
			.unwrap()
			.catch(() => undefined);
	}
	viewingUid = null;
	try {
		if (!initialisedAppId) {
			// Nothing started in this run: end a session a previous run left in the SDK's storage.
			const mark = await SecureStore.getItemAsync(MARK_KEY);
			if (mark) {
				const { appId, region } = JSON.parse(mark) as { appId: string; region: string };
				await ensureInit(appId, region);
			}
		}
		if (initialisedAppId) {
			removeListeners();
			if (await CometChat.getLoggedinUser()) await CometChat.logout();
		}
		await SecureStore.deleteItemAsync(MARK_KEY);
	} catch (err) {
		// The server revokes the token at sign-out regardless.
		console.log("Chat sign-out failed:", errorCode(err));
	}
	clearCaches();
	starting = null;
	state = initial;
	stateListeners.forEach((l) => l());
}

export const chatRuntime = {
	/** Signs in to chat once; later calls share the same attempt. */
	start(): Promise<void> {
		if (state.status === "ready") return Promise.resolve();
		if (!starting || state.status !== "connecting") starting = start();
		return starting;
	},
	signOut,
	/** After the SDK refused a call for its session: start again (asks the server for a token once). */
	recover(err: unknown) {
		if (!isAuthError(err) || state.status !== "ready") return;
		setState({ status: "idle" });
		void chatRuntime.start();
	},
	getState: () => state,
	subscribe(listener: () => void) {
		stateListeners.add(listener);
		return () => {
			stateListeners.delete(listener);
		};
	},
	onEvent(listener: (e: ChatEvent) => void) {
		eventListeners.add(listener);
		return () => {
			eventListeners.delete(listener);
		};
	},

	/** The conversation on screen, or null. The server sends no push for it (contract section 6). */
	setViewing(uid: string | null) {
		if (state.status !== "ready") {
			viewingUid = null;
			return Promise.resolve();
		}
		viewingUid = uid;
		if (uid && state.unread[uid]) {
			const rest = { ...state.unread };
			delete rest[uid];
			setState({ unread: rest });
		}
		return store
			.dispatch(chatApi.endpoints.setChatViewing.initiate({ withUid: uid }))
			.unwrap()
			.then(() => undefined)
			.catch(() => undefined);
	},
	refreshUnread,

	messagesRequest: (uid: string) =>
		new CometChat.MessagesRequestBuilder()
			.setUID(uid)
			.setLimit(30)
			.hideReplies(true)
			.setCategories([CometChat.CATEGORY_MESSAGE])
			.build(),

	/** Messages after `afterId`, to catch up after a reconnect. */
	newerRequest: (uid: string, afterId: number) =>
		new CometChat.MessagesRequestBuilder()
			.setUID(uid)
			.setMessageId(afterId)
			.setLimit(50)
			.hideReplies(true)
			.setCategories([CometChat.CATEGORY_MESSAGE])
			.build(),

	conversationsRequest: () =>
		new CometChat.ConversationsRequestBuilder()
			.setLimit(50)
			.setConversationType(USER)
			.withBlockedInfo(true)
			.build(),

	/** The conversation list, newest first. Callers share one request; the answer stays in the cache. */
	loadConversations(): Promise<CometChat.Conversation[]> {
		if (conversationsLoading) return conversationsLoading;
		const gen = generation;
		const load = chatRuntime
			.conversationsRequest()
			.fetchNext()
			.then((list) => {
				if (gen === generation && cacheUsable()) conversationsCache = list;
				return list;
			})
			.finally(() => {
				if (conversationsLoading === load) conversationsLoading = null;
			});
		conversationsLoading = load;
		return load;
	},
	cachedConversations: () => (cacheUsable() ? conversationsCache : null),
	cachedMessages: (uid: string) => (cacheUsable() ? (messagesCache.get(uid) ?? null) : null),
	rememberMessages,

	/**
	 * Run once chat is signed in: loads the list and the latest messages of the newest conversations, so the Chat
	 * tab opens with content instead of a spinner. Failures are left to the screens, which load what is missing.
	 */
	async prefetch() {
		if (state.status !== "ready") return;
		const gen = generation;
		try {
			void store.dispatch(chatApi.endpoints.getChatContacts.initiate(undefined, { subscribe: false }));
			const list = await chatRuntime.loadConversations();
			const uids = list
				.map((c) => (c.getConversationWith() as CometChat.User)?.getUid?.())
				.filter((uid): uid is string => !!uid)
				.slice(0, 3);
			await Promise.all(
				uids.map(async (uid) => {
					if (messagesCache.has(uid)) return;
					const page = await chatRuntime.messagesRequest(uid).fetchPrevious();
					if (gen === generation) rememberMessages(uid, page);
				}),
			);
		} catch {
			// Nothing cached; the screens show their own loading and error states.
		}
	},

	async getUser(uid: string) {
		const user = await CometChat.getUser(uid);
		setPresence(uid, { online: user.getStatus() === "online", lastActiveAt: ms(user.getLastActiveAt()) });
		return user;
	},

	/** Marks everything up to this incoming message as read (one-to-one: the receiver id is the sender). */
	markRead(messageId: number, peer: string) {
		try {
			void Promise.resolve(CometChat.markAsRead(String(messageId), peer, USER, peer)).catch(() => undefined);
		} catch {
			// Read state catches up on the next message shown.
		}
	},

	startTyping: (uid: string) => CometChat.startTyping(new CometChat.TypingIndicator(uid, USER)),
	endTyping: (uid: string) => CometChat.endTyping(new CometChat.TypingIndicator(uid, USER)),

	async sendText(uid: string, text: string, muid: string) {
		const message = new CometChat.TextMessage(uid, text, USER);
		message.setMuid(muid);
		return (await CometChat.sendMessage(message)) as CometChat.BaseMessage;
	},
};

export const newMuid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
