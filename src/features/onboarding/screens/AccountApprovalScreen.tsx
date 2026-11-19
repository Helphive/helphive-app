import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Button, Notice, useToast } from "@/ui";
import { SuccessIcon } from "@/ui/icons";
import { getErrorMessage } from "@/services/api/errors";
import { useAcknowledgeApprovalMutation } from "../api";
import AccountStatusLayout from "../components/AccountStatusLayout";

/** Shown once after approval. Continuing records that it was seen, then opens the provider home. */
export default function AccountApprovalScreen({ preview = false }: { preview?: boolean }) {
	const navigation = useNavigation();
	const toast = useToast();
	const [acknowledge, { isLoading }] = useAcknowledgeApprovalMutation();
	const [error, setError] = useState<string | null>(null);

	const onContinue = async () => {
		if (preview) {
			toast.show("Preview only: nothing was recorded.");
			return;
		}
		setError(null);
		try {
			await acknowledge().unwrap();
			navigation.reset({ index: 0, routes: [{ name: "ProviderHome" }] });
		} catch (err) {
			setError(getErrorMessage(err, "Could not open your dashboard. Try again."));
		}
	};

	return (
		<AccountStatusLayout
			preview={preview}
			tone="green"
			statusLabel="Approved"
			icon={SuccessIcon}
			title="You are approved"
			description="Your provider profile has been approved. You can start accepting jobs from hotels and venues today."
			notice={error ? <Notice tone="error">{error}</Notice> : undefined}
			nextTitle="Get started"
			next={[
				"Switch on availability on your home screen and choose the services you provide.",
				"Browse available orders and accept the ones that fit your day.",
				"Set up payouts under Balance so you can withdraw what you earn.",
			]}
			actions={
				<Button loading={isLoading} onPress={() => void onContinue()} fullWidth>
					Go to my dashboard
				</Button>
			}
		/>
	);
}
