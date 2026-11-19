import React, { useEffect } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Button, EmptyState, ErrorState, ListSkeleton, PageTitle, Panel, Screen } from "@/ui";
import { ChatIcon } from "@/ui/icons";
import { useAuthCheck } from "@/features/auth/useAuthCheck";
import { roleOf } from "@/features/auth/types";
import type { CustomerTabParamList } from "@/navigation/types";
import { chatRuntime } from "../chatRuntime";
import { useConversations } from "../useConversations";
import ConversationRow from "../components/ConversationRow";

/** The Chat tab (both roles): conversations, newest first. A `uid` param (link or push) opens that conversation. */
export default function ChatScreen() {
	const navigation = useNavigation();
	const route = useRoute<RouteProp<CustomerTabParamList, "ChatTab">>();
	const uid = route.params?.uid;
	const provider = roleOf(useAuthCheck().userDetails) === "provider";
	const { chat, items, loading, failed, fetching, refresh } = useConversations();

	useEffect(() => {
		if (!uid) return;
		navigation.setParams({ uid: undefined });
		navigation.navigate("ChatConversation", { uid });
	}, [uid, navigation]);

	const title = (
		<PageTitle
			title="Messages"
			subtitle={
				provider
					? "Talk to the customers whose bookings you accepted."
					: "Talk to the providers who accepted your bookings."
			}
		/>
	);

	let body: React.ReactNode;
	if (chat.status === "unavailable" || chat.status === "refused" || chat.status === "error") {
		const heading =
			chat.status === "unavailable"
				? "Chat is not available"
				: chat.status === "refused"
					? "Chat is turned off"
					: "Chat could not connect";
		body = (
			<ErrorState
				title={heading}
				message={chat.message}
				onRetry={chat.status === "refused" ? undefined : () => void chatRuntime.start()}
			/>
		);
	} else if (loading) {
		body = <ListSkeleton rows={4} withHeader={false} />;
	} else if (failed) {
		body = (
			<ErrorState
				title="Could not load conversations"
				message="Check your connection and try again."
				onRetry={refresh}
			/>
		);
	} else if (items.length === 0) {
		body = (
			<EmptyState
				icon={ChatIcon}
				title="No conversations yet"
				description={
					provider
						? "Chat opens when you accept a booking. You can then message the customer here."
						: "Chat opens when a provider accepts one of your bookings. You can then message them here."
				}
				action={
					<Button
						variant="secondary"
						onPress={() =>
							provider
								? navigation.navigate("ProviderHome", { screen: "OrdersTab" })
								: navigation.navigate("CustomerHome", { screen: "BookingsTab" })
						}
					>
						{provider ? "Browse available orders" : "Go to bookings"}
					</Button>
				}
			/>
		);
	} else {
		body = (
			<Panel flush>
				{items.map((item, index) => (
					<ConversationRow
						key={item.uid}
						item={item}
						first={index === 0}
						presence={chat.presence[item.uid]}
						typing={!!chat.typing[item.uid]}
						onPress={() => navigation.navigate("ChatConversation", { uid: item.uid })}
					/>
				))}
			</Panel>
		);
	}

	return (
		<Screen
			inTabs
			refreshing={chat.status === "ready" && fetching}
			onRefresh={chat.status === "ready" ? refresh : undefined}
		>
			{title}
			{body}
		</Screen>
	);
}
