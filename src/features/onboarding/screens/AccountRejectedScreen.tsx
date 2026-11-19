import React from "react";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Button, Panel, Text } from "@/ui";
import { EmailIcon, ErrorIcon } from "@/ui/icons";
import { useAuthCheck } from "@/features/auth/useAuthCheck";
import AccountStatusLayout, { SUPPORT_EMAIL } from "../components/AccountStatusLayout";

/** The application was not approved: the reviewer's reason, apply again, or ask support. */
export default function AccountRejectedScreen({
	preview = false,
	previewReason,
}: {
	preview?: boolean;
	previewReason?: string;
}) {
	const navigation = useNavigation();
	const { userDetails } = useAuthCheck();
	const reason = preview ? previewReason : userDetails?.rejectReason;

	return (
		<AccountStatusLayout
			preview={preview}
			tone="red"
			statusLabel="Not approved"
			icon={ErrorIcon}
			title="Application not approved"
			description="We could not approve your provider application this time. You can send a new application or ask our team about the decision."
			notice={
				reason ? (
					<Panel title="Reason from our team">
						<Text variant="ui">{reason}</Text>
					</Panel>
				) : undefined
			}
			nextTitle="What you can do"
			next={[
				reason
					? "Check your documents and details against the reason above."
					: "Check that your documents are clear, current and match your details.",
				"Apply again with the corrected documents.",
				"If you think this was a mistake, contact our support team.",
			]}
			support={false}
			actions={
				<>
					<Button
						fullWidth
						onPress={() =>
							preview ? undefined : navigation.reset({ index: 0, routes: [{ name: "ProviderDetails" }] })
						}
					>
						Apply again
					</Button>
					<Button
						fullWidth
						variant="secondary"
						icon={EmailIcon}
						onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
					>
						Contact support
					</Button>
				</>
			}
		/>
	);
}
