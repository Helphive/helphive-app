import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
	Button,
	ErrorState,
	IconButton,
	Notice,
	Screen,
	Skeleton,
	Text,
	layout,
	space,
	useToast,
	makeStyles,
} from "@/ui";
import { BackIcon, MoreIcon } from "@/ui/icons";
import { formatDate } from "@/lib/format";
import type { RootScreenProps } from "@/navigation/types";
import { useGetChatBlocksQuery, useGetChatContactsQuery, useUnblockChatUserMutation } from "../api";
import { chatRuntime, type ChatMessage } from "../chatRuntime";
import { dayLabel, fullName, presenceText, sameDay } from "../chatModel";
import { useChatState } from "../useConversations";
import { useConversation } from "../useConversation";
import MessageBubble from "../components/MessageBubble";
import Composer from "../components/Composer";
import { PersonAvatar } from "../components/ConversationRow";
import SafetySheets from "../components/SafetySheets";

type Row = { kind: "message"; key: string; message: ChatMessage } | { kind: "day"; key: string; label: string };

/** One conversation: header with the person, messages (newest at the bottom), and the composer or why it is closed. */
export default function ConversationScreen({ route }: RootScreenProps<"ChatConversation">) {
	const styles = useStyles();
	const { uid } = route.params;
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const toast = useToast();
	const chat = useChatState();
	const ready = chat.status === "ready";
	const convo = useConversation(uid, ready ? chat.me : undefined);

	const contactsQ = useGetChatContactsQuery(undefined, { skip: !ready });
	const blocksQ = useGetChatBlocksQuery(undefined, { skip: !ready });
	const [unblock, unblocking] = useUnblockChatUserMutation();
	const contact = contactsQ.data?.contacts.find((c) => c.uid === uid);
	const blockedByMe = !!blocksQ.data?.blocked.some((b) => b.uid === uid);

	// Name, photo and blocks from CometChat, for people who are no longer contacts (closed chats, links).
	const [person, setPerson] = useState<{ name: string; avatar?: string; hasBlockedMe: boolean } | null>(null);
	const refreshPerson = useCallback(() => {
		if (!ready) return;
		chatRuntime
			.getUser(uid)
			.then((u) => setPerson({ name: u.getName(), avatar: u.getAvatar(), hasBlockedMe: u.getHasBlockedMe() }))
			.catch(() => setPerson((cur) => cur ?? { name: "", hasBlockedMe: false }));
	}, [ready, uid]);
	useEffect(refreshPerson, [refreshPerson]);

	const name = fullName(contact, person?.name || "");
	const firstName = contact?.firstName || name.split(" ")[0] || "";
	const avatar = [contact?.avatar, person?.avatar].find((u) => !!u && /^https:\/\//.test(u));
	const closed = convo.closedNow || (contactsQ.data ? !contact : false);
	const canWrite = !blockedByMe && !person?.hasBlockedMe && !closed;
	const [menu, setMenu] = useState(false);

	// Newest first for the inverted list, with a day label above each day's first message.
	const rows = useMemo(() => {
		const out: Row[] = [];
		const list = convo.messages;
		for (let i = list.length - 1; i >= 0; i--) {
			const m = list[i];
			out.push({ kind: "message", key: m.key, message: m });
			if (i === 0 || !sameDay(list[i - 1].sentAt, m.sentAt)) {
				out.push({ kind: "day", key: `day-${m.sentAt}`, label: dayLabel(m.sentAt) });
			}
		}
		return out;
	}, [convo.messages]);
	const lastMineKey = useMemo(
		() => [...convo.messages].reverse().find((m) => m.mine && m.state !== "failed")?.key,
		[convo.messages],
	);

	const header = (
		<View style={[styles.header, { paddingTop: insets.top, height: layout.headerHeight + 8 + insets.top }]}>
			<IconButton icon={BackIcon} label="Back to conversations" onPress={() => navigation.goBack()} />
			{name ? <PersonAvatar name={name} uri={avatar} presence={chat.presence[uid]} size={36} /> : null}
			<View style={styles.flex}>
				<Text variant="panelTitle" numberOfLines={1} accessibilityRole="header">
					{name || "Conversation"}
				</Text>
				<Text variant="caption" numberOfLines={1} accessibilityLiveRegion="polite">
					{chat.typing[uid] ? "Typing…" : presenceText(chat.presence[uid])}
				</Text>
			</View>
			{ready && name ? (
				<IconButton
					icon={MoreIcon}
					label={`Options for this conversation with ${firstName}`}
					onPress={() => setMenu(true)}
				/>
			) : null}
		</View>
	);

	if (chat.status !== "ready" && chat.status !== "connecting" && chat.status !== "idle") {
		return (
			<Screen header={header}>
				<ErrorState
					title={chat.status === "refused" ? "Chat is turned off" : "Chat could not connect"}
					message={chat.message}
					onRetry={chat.status === "refused" ? undefined : () => void chatRuntime.start()}
				/>
			</Screen>
		);
	}

	let footer: React.ReactNode;
	if (blockedByMe) {
		footer = (
			<Notice
				tone="warning"
				action={
					<Button
						size="sm"
						variant="secondary"
						loading={unblocking.isLoading}
						onPress={() =>
							unblock({ uid })
								.unwrap()
								.then(() => {
									toast.success(`${firstName || "This person"} is unblocked`);
									refreshPerson();
								})
								.catch(() => toast.error("Could not unblock. Try again."))
						}
					>
						Unblock
					</Button>
				}
			>
				{`You blocked ${firstName || "this person"}. Neither of you can send messages.`}
			</Notice>
		);
	} else if (person?.hasBlockedMe) {
		footer = <Notice tone="info">You cannot send messages in this conversation.</Notice>;
	} else if (closed) {
		footer = (
			<Notice tone="info">
				This chat has closed. You can still read it. It opens again if you share a new booking.
			</Notice>
		);
	}

	return (
		<Screen header={header} scroll={false}>
			{chat.connection !== "connected" && ready ? (
				<View style={styles.banner}>
					<Text variant="caption" color="amber700" accessibilityLiveRegion="polite">
						Connection lost. Reconnecting…
					</Text>
				</View>
			) : null}
			{contact?.until && canWrite ? (
				<View style={styles.banner}>
					<Text variant="caption" color="ink600">
						{`Chat closes on ${formatDate(contact.until)}`}
					</Text>
				</View>
			) : null}
			{!ready || convo.loading ? (
				<View style={styles.loading} accessibilityRole="progressbar" accessibilityLabel="Loading messages">
					{[60, 40, 70, 30].map((w, i) => (
						<Skeleton
							key={i}
							width={`${w}%`}
							height={40}
							radius={14}
							style={{ alignSelf: i % 2 ? "flex-end" : "flex-start" }}
						/>
					))}
				</View>
			) : convo.loadError ? (
				<View style={styles.pad}>
					<ErrorState
						title="Could not load messages"
						message="Check your connection and try again."
						onRetry={() => void convo.reload()}
					/>
				</View>
			) : rows.length === 0 ? (
				<View style={styles.empty}>
					<Text variant="panelTitle" align="center">
						{canWrite ? `Say hello to ${firstName || "them"}` : "No messages"}
					</Text>
					<Text variant="ui" color="ink600" align="center">
						{canWrite
							? "Ask about access, parking or anything else about the shift."
							: "There is nothing in this conversation yet."}
					</Text>
				</View>
			) : (
				<FlatList
					inverted
					data={rows}
					keyExtractor={(r) => r.key}
					contentContainerStyle={styles.list}
					keyboardShouldPersistTaps="handled"
					onEndReached={() => void convo.loadOlder()}
					onEndReachedThreshold={0.3}
					ListFooterComponent={
						convo.loadingOlder ? (
							<View style={styles.older} accessibilityLabel="Loading older messages">
								<Skeleton width={200} height={32} radius={14} />
							</View>
						) : !convo.hasMore ? (
							<Text variant="caption" align="center" style={styles.start}>
								{`Start of your conversation with ${firstName || "them"}`}
							</Text>
						) : null
					}
					renderItem={({ item }) =>
						item.kind === "day" ? (
							<Text variant="caption" align="center" style={styles.day} accessibilityRole="header">
								{item.label}
							</Text>
						) : (
							<MessageBubble
								message={item.message}
								showStatus={item.key === lastMineKey}
								onRetry={convo.retry}
								onDiscard={convo.discard}
							/>
						)
					}
				/>
			)}
			{footer ? (
				<View style={[styles.closed, { paddingBottom: insets.bottom + space[3] }]}>{footer}</View>
			) : ready ? (
				<Composer name={firstName} onSend={convo.send} onType={convo.onType} />
			) : null}
			{ready && name ? (
				<SafetySheets
					uid={uid}
					firstName={firstName || name}
					blocked={blockedByMe}
					visible={menu}
					onClose={() => setMenu(false)}
					onChanged={refreshPerson}
				/>
			) : null}
		</Screen>
	);
}

const useStyles = makeStyles(({ color }) => ({
	flex: { flex: 1, minWidth: 0 },
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: space[2],
		paddingHorizontal: space[2],
		backgroundColor: color.surface,
		borderBottomWidth: 1,
		borderBottomColor: color.line,
	},
	banner: {
		paddingHorizontal: layout.gutter,
		paddingVertical: space[2],
		backgroundColor: color.subtle,
		borderBottomWidth: 1,
		borderBottomColor: color.line,
	},
	list: { paddingHorizontal: layout.gutter, paddingVertical: space[3] },
	loading: { flex: 1, padding: layout.gutter, gap: space[3] },
	pad: { flex: 1, padding: layout.gutter },
	empty: { flex: 1, justifyContent: "center", padding: space[8], gap: space[2] },
	older: { alignItems: "center", paddingVertical: space[3] },
	start: { paddingVertical: space[4] },
	day: { paddingVertical: space[3] },
	closed: {
		paddingHorizontal: layout.gutter,
		paddingTop: space[3],
		backgroundColor: color.surface,
		borderTopWidth: 1,
		borderTopColor: color.line,
	},
}));
