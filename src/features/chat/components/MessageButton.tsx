import React from "react";
import { useNavigation } from "@react-navigation/native";
import { Button, useToast } from "@/ui";
import { ChatIcon } from "@/ui/icons";
import { getErrorMessage } from "@/services/api/errors";
import { useLazyGetBookingConversationQuery } from "../api";

/** Opens the chat with the other person on a booking. The server decides whether that chat is open. */
export default function MessageButton({ bookingId, label }: { bookingId: string; label: string }) {
	const navigation = useNavigation();
	const toast = useToast();
	const [lookUp, { isFetching }] = useLazyGetBookingConversationQuery();

	const open = async () => {
		try {
			const answer = await lookUp(bookingId).unwrap();
			if (answer.conversation) navigation.navigate("ChatConversation", { uid: answer.conversation.withUid });
			else toast.show(answer.message ?? "Chat is not open for this booking yet.");
		} catch (error) {
			toast.error(getErrorMessage(error, "Could not open the chat. Try again."));
		}
	};

	return (
		<Button variant="secondary" icon={ChatIcon} loading={isFetching} onPress={open}>
			{label}
		</Button>
	);
}
