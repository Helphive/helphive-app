import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { CometChat } from "@cometchat/chat-sdk-react-native";
import { useGetChatBlocksQuery, useGetChatContactsQuery, type ChatContact } from "./api";
import { chatRuntime, setPresence, toChatMessage, type ChatMessage } from "./chatRuntime";
import { fullName, preview } from "./chatModel";
import { usePairBookings } from "./usePairBookings";

/** The chat session's state; starts it if it is not running yet (a failed start is retried here). */
export function useChatState() {
	const state = useSyncExternalStore(chatRuntime.subscribe, chatRuntime.getState);
	useEffect(() => {
		void chatRuntime.start();
	}, []);
	return state;
}

export interface ConversationItem {
	uid: string;
	name: string;
	firstName: string;
	avatar?: string;
	lastText: string;
	lastAt?: number;
	unread: number;
	/** May chat now (shares a booking in its window). Null while the server's answer is loading. */
	open: boolean | null;
	until: string | null;
	blocked: boolean;
}

interface CometPerson {
	uid: string;
	name: string;
	avatar?: string;
	last?: ChatMessage | null;
	blockedByMe: boolean;
}

const httpsOnly = (url?: string) => (url && /^https:\/\//i.test(url) ? url : undefined);

const toPeople = (list: CometChat.Conversation[], me: string) => {
	const map = new Map<string, CometPerson>();
	for (const c of list) {
		const u = c.getConversationWith() as CometChat.User;
		if (!u?.getUid) continue;
		const lastRaw = c.getLastMessage();
		map.set(u.getUid(), {
			uid: u.getUid(),
			name: u.getName(),
			avatar: httpsOnly(u.getAvatar()),
			last: lastRaw ? toChatMessage(lastRaw, me) : null,
			blockedByMe: !!u.getBlockedByMe?.(),
		});
	}
	return map;
};

const notePresence = (list: CometChat.Conversation[]) => {
	for (const c of list) {
		const u = c.getConversationWith() as CometChat.User;
		if (!u?.getUid) continue;
		const lastActive = u.getLastActiveAt?.();
		setPresence(u.getUid(), {
			online: u.getStatus() === "online",
			lastActiveAt: lastActive ? lastActive * 1000 : undefined,
		});
	}
};

/**
 * Conversations from CometChat, kept current by the message listener. Opens with the list loaded last (chat loads
 * it right after sign-in) and refreshes it in the background.
 */
function useCometConversations(me: string | undefined) {
	const [people, setPeople] = useState<Map<string, CometPerson>>(() => {
		const cached = me ? chatRuntime.cachedConversations() : null;
		return cached && me ? toPeople(cached, me) : new Map();
	});
	const [loaded, setLoaded] = useState(() => !!me && !!chatRuntime.cachedConversations());
	const [failed, setFailed] = useState(false);
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		if (!me) return;
		let alive = true;
		const cached = chatRuntime.cachedConversations();
		if (cached) {
			setPeople(toPeople(cached, me));
			setLoaded(true);
			notePresence(cached);
		}
		const fetchAll = async () => {
			try {
				const list = await chatRuntime.loadConversations();
				if (!alive) return;
				setPeople(toPeople(list, me));
				notePresence(list);
				setFailed(false);
			} catch (err) {
				// A list already on screen stays; the error state is for having nothing to show.
				if (alive && !chatRuntime.cachedConversations()) setFailed(true);
				chatRuntime.recover(err);
			} finally {
				if (alive) setLoaded(true);
			}
		};
		void fetchAll();
		const off = chatRuntime.onEvent((e) => {
			if (e.type === "reconnected") void fetchAll();
			if (e.type !== "message") return;
			setPeople((cur) => {
				const existing = cur.get(e.message.peer);
				if (!existing) {
					void fetchAll();
					return cur;
				}
				const next = new Map(cur);
				next.set(e.message.peer, { ...existing, last: e.message });
				return next;
			});
		});
		return () => {
			alive = false;
			off();
		};
	}, [me, attempt]);

	return { people, loaded, failed, retry: () => setAttempt((n) => n + 1) };
}

/**
 * The conversation list: everyone this person has talked to (CometChat) plus everyone they may talk to now (the
 * server's contacts). People outside a booking window are marked closed; the server decides, CometChat enforces.
 */
export function useConversations() {
	const chat = useChatState();
	const ready = chat.status === "ready";
	const contactsQ = useGetChatContactsQuery(undefined, { skip: !ready, refetchOnMountOrArgChange: 30 });
	const blocksQ = useGetChatBlocksQuery(undefined, { skip: !ready });
	const comet = useCometConversations(ready ? chat.me : undefined);
	// For the previews of booking events (confirmed against the viewer's own bookings, as in the thread).
	const { byPerson } = usePairBookings();

	const contacts = useMemo(() => {
		const map = new Map<string, ChatContact>();
		contactsQ.data?.contacts.forEach((c) => map.set(c.uid, c));
		return map;
	}, [contactsQ.data]);
	const blocked = useMemo(() => new Set(blocksQ.data?.blocked.map((b) => b.uid) ?? []), [blocksQ.data]);

	const items: ConversationItem[] = useMemo(() => {
		const uids = new Set([...comet.people.keys(), ...contacts.keys()]);
		return [...uids]
			.map((uid) => {
				const p = comet.people.get(uid);
				const c = contacts.get(uid);
				const name = fullName(c, p?.name || "HelpHive member");
				return {
					uid,
					name,
					firstName: c?.firstName || name.split(" ")[0],
					avatar: httpsOnly(c?.avatar) ?? p?.avatar,
					lastText: preview(p?.last, byPerson.get(uid)),
					lastAt: p?.last?.sentAt,
					unread: chat.unread[uid] ?? 0,
					open: contactsQ.data ? contacts.has(uid) : null,
					until: c?.until ?? null,
					blocked: blocked.has(uid) || !!p?.blockedByMe,
				};
			})
			.sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0));
	}, [comet.people, contacts, contactsQ.data, blocked, chat.unread, byPerson]);

	const refresh = () => {
		comet.retry();
		void contactsQ.refetch();
		void chatRuntime.refreshUnread();
	};

	return {
		chat,
		items,
		loading: !ready || (!comet.loaded && !contactsQ.data),
		failed: comet.failed && contactsQ.isError,
		fetching: contactsQ.isFetching,
		refresh,
		contacts,
		blocked,
		contactsLoaded: !!contactsQ.data,
	};
}
