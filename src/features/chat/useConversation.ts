import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { CometChat } from "@cometchat/chat-sdk-react-native";
import store from "@/store";
import { chatApi } from "./api";
import { chatRuntime, errorCode, newMuid, toChatMessage, type ChatMessage } from "./chatRuntime";

const PAGE = 30;
const VIEWING_EVERY_MS = 60_000;
const TYPING_IDLE_MS = 3_000;

/**
 * One conversation: history (newest page first, older pages on demand), live messages and receipts, sending with
 * optimistic bubbles and retry, read receipts, typing, and the viewing signal while it is on screen.
 */
export function useConversation(uid: string, me: string | undefined) {
	const toList = useCallback(
		(page: CometChat.BaseMessage[]) =>
			me ? page.map((m) => toChatMessage(m, me)).filter((m): m is ChatMessage => !!m) : [],
		[me],
	);
	// Opens with the messages loaded last (if any) and checks them against the server.
	const [messages, setMessages] = useState<ChatMessage[]>(() => toList(chatRuntime.cachedMessages(uid) ?? []));
	const [loading, setLoading] = useState(() => !chatRuntime.cachedMessages(uid));
	const [refreshing, setRefreshing] = useState(false);
	const [loadError, setLoadError] = useState(false);
	const [loadingOlder, setLoadingOlder] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [closedNow, setClosedNow] = useState(false);
	const request = useRef<CometChat.MessagesRequest | null>(null);
	const latest = useRef<ChatMessage[]>([]);
	latest.current = messages;

	const markLatestRead = useCallback(
		(list: ChatMessage[]) => {
			const last = [...list].reverse().find((m) => !m.mine && m.id);
			if (last?.id && AppState.currentState === "active") chatRuntime.markRead(last.id, uid);
		},
		[uid],
	);

	const load = useCallback(async () => {
		if (!me) return;
		const cached = chatRuntime.cachedMessages(uid);
		if (cached) setMessages(toList(cached));
		setLoading(!cached);
		setRefreshing(!!cached);
		setLoadError(false);
		const mine = chatRuntime.messagesRequest(uid);
		request.current = mine;
		try {
			const page = await mine.fetchPrevious();
			if (request.current !== mine) return;
			chatRuntime.rememberMessages(uid, page);
			const list = toList(page);
			// Keep anything still being sent, and anything that arrived while the page was loading.
			setMessages((cur) => {
				const known = new Set(list.flatMap((m) => (m.muid ? [m.key, m.muid] : [m.key])));
				const lastId = list.reduce((max, m) => Math.max(max, m.id ?? 0), 0);
				return [
					...list,
					...cur.filter(
						(m) => !known.has(m.key) && !(m.muid && known.has(m.muid)) && (!m.id || m.id > lastId),
					),
				];
			});
			setHasMore(page.length >= PAGE);
			markLatestRead(list);
		} catch (err) {
			if (!cached) setLoadError(true);
			chatRuntime.recover(err);
		} finally {
			if (request.current === mine) {
				setLoading(false);
				setRefreshing(false);
			}
		}
	}, [uid, me, markLatestRead, toList]);

	useEffect(() => {
		void load();
		setClosedNow(false);
	}, [load]);

	const loadOlder = useCallback(async () => {
		if (!request.current || !me || loadingOlder || !hasMore || loading || refreshing) return;
		setLoadingOlder(true);
		try {
			const page = await request.current.fetchPrevious();
			const older = page.map((m) => toChatMessage(m, me)).filter((m): m is ChatMessage => !!m);
			setMessages((cur) => {
				const seen = new Set(cur.map((m) => m.key));
				return [...older.filter((m) => !seen.has(m.key)), ...cur];
			});
			setHasMore(page.length >= PAGE);
		} catch {
			// Tried again on the next scroll to the top.
		} finally {
			setLoadingOlder(false);
		}
	}, [loadingOlder, hasMore, loading, refreshing, me]);

	/* Live events: new messages, receipts, catch-up after a reconnect. */
	useEffect(() => {
		if (!me) return;
		return chatRuntime.onEvent((e) => {
			if (e.type === "message" && e.message.peer === uid) {
				const m = e.message;
				setMessages((cur) => {
					const i = cur.findIndex((x) => (m.id && x.id === m.id) || (m.muid && x.muid === m.muid));
					if (i < 0) return [...cur, m];
					const next = cur.slice();
					next[i] = { ...m, key: cur[i].key };
					return next;
				});
				if (!m.mine) markLatestRead([m]);
			} else if (e.type === "receipt" && e.peer === uid) {
				setMessages((cur) =>
					cur.map((m) =>
						m.mine && m.id && m.id <= e.messageId
							? e.kind === "read"
								? { ...m, readAt: m.readAt ?? e.at, deliveredAt: m.deliveredAt ?? e.at }
								: { ...m, deliveredAt: m.deliveredAt ?? e.at }
							: m,
					),
				);
			} else if (e.type === "reconnected") {
				const lastId = [...latest.current].reverse().find((m) => m.id)?.id;
				if (!lastId) return;
				chatRuntime
					.newerRequest(uid, lastId)
					.fetchNext()
					.then((page) => {
						const newer = page.map((m) => toChatMessage(m, me)).filter((m): m is ChatMessage => !!m);
						setMessages((c) => {
							const seen = new Set(c.map((m) => m.id));
							return [...c, ...newer.filter((m) => !seen.has(m.id))];
						});
						markLatestRead(newer);
					})
					.catch(() => undefined);
			}
		});
	}, [uid, me, markLatestRead]);

	/* Viewing signal while the screen is focused and the app in the foreground (no push for this conversation). */
	useFocusEffect(
		useCallback(() => {
			if (!me) return;
			let timer: ReturnType<typeof setInterval> | undefined;
			const sync = () => {
				clearInterval(timer);
				if (AppState.currentState === "active") {
					void chatRuntime.setViewing(uid);
					timer = setInterval(() => void chatRuntime.setViewing(uid), VIEWING_EVERY_MS);
					markLatestRead(latest.current);
				} else {
					void chatRuntime.setViewing(null);
				}
			};
			sync();
			const sub = AppState.addEventListener("change", sync);
			return () => {
				sub.remove();
				clearInterval(timer);
				void chatRuntime.setViewing(null);
			};
		}, [uid, me, markLatestRead]),
	);

	/* Typing: start once, end after 3 s idle. */
	const typing = useRef<ReturnType<typeof setTimeout> | null>(null);
	const onType = useCallback(() => {
		try {
			if (!typing.current) chatRuntime.startTyping(uid);
			if (typing.current) clearTimeout(typing.current);
			typing.current = setTimeout(() => {
				typing.current = null;
				chatRuntime.endTyping(uid);
			}, TYPING_IDLE_MS);
		} catch {
			// Typing is a nicety.
		}
	}, [uid]);
	useEffect(
		() => () => {
			if (typing.current) {
				clearTimeout(typing.current);
				chatRuntime.endTyping(uid);
			}
		},
		[uid],
	);

	/* Sending with optimistic bubbles. */
	const deliver = useCallback(
		async (m: ChatMessage) => {
			if (!me || !m.muid) return;
			try {
				const sent = await chatRuntime.sendText(uid, m.text ?? "", m.muid);
				const done = toChatMessage(sent, me);
				setMessages((cur) =>
					cur.map((x) =>
						x.muid === m.muid ? (done ? { ...done, key: x.key } : { ...x, state: "sent" }) : x,
					),
				);
			} catch (err) {
				let error = "Not sent. Check your connection and try again.";
				const code = errorCode(err);
				if (code === "ERR_PERMISSION_DENIED") {
					error = "This chat has closed.";
					setClosedNow(true);
					store.dispatch(chatApi.util.invalidateTags(["ChatContacts"]));
				} else if (/BLOCK/i.test(code)) {
					error = "You cannot send messages in this conversation.";
				} else {
					chatRuntime.recover(err);
				}
				setMessages((cur) => cur.map((x) => (x.muid === m.muid ? { ...x, state: "failed", error } : x)));
			}
		},
		[uid, me],
	);

	const send = useCallback(
		(text: string) => {
			if (typing.current) {
				clearTimeout(typing.current);
				typing.current = null;
				chatRuntime.endTyping(uid);
			}
			const muid = newMuid();
			const m: ChatMessage = {
				key: muid,
				muid,
				mine: true,
				peer: uid,
				sentAt: Date.now(),
				kind: "text",
				text,
				state: "sending",
			};
			setMessages((cur) => [...cur, m]);
			void deliver(m);
		},
		[uid, deliver],
	);

	const retry = useCallback(
		(m: ChatMessage) => {
			const muid = newMuid();
			const again: ChatMessage = {
				...m,
				key: muid,
				muid,
				state: "sending",
				error: undefined,
				sentAt: Date.now(),
			};
			setMessages((cur) => [...cur.filter((x) => x.key !== m.key), again]);
			void deliver(again);
		},
		[deliver],
	);

	const discard = useCallback((m: ChatMessage) => setMessages((cur) => cur.filter((x) => x.key !== m.key)), []);

	return {
		messages,
		loading,
		loadError,
		reload: load,
		loadingOlder,
		hasMore,
		loadOlder,
		closedNow,
		send,
		retry,
		discard,
		onType,
	};
}
