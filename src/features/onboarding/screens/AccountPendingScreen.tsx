import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Button, useToast } from "@/ui";
import { PendingIcon, RetryIcon } from "@/ui/icons";
import { useAuthCheck } from "@/features/auth/useAuthCheck";
import { getHomeRoute } from "@/features/auth/session";
import AccountStatusLayout from "../components/AccountStatusLayout";

/** The application is with the team. "Check status" reloads the account and moves on once it has been decided. */
export default function AccountPendingScreen({ preview = false }: { preview?: boolean }) {
	const navigation = useNavigation();
	const toast = useToast();
	const { refetch } = useAuthCheck();
	const [checking, setChecking] = useState(false);

	const checkStatus = async () => {
		if (preview) {
			toast.show("Preview only: the status was not checked.");
			return;
		}
		setChecking(true);
		const result = await refetch();
		setChecking(false);
		const route = result.data ? getHomeRoute(result.data) : null;
		if (result.isError || !route) {
			toast.error("Could not check your status. Check your connection and try again.");
		} else if (route === "AccountPending") {
			toast.show("Your application is still under review.");
		} else {
			navigation.reset({ index: 0, routes: [{ name: route }] });
		}
	};

	return (
		<AccountStatusLayout
			preview={preview}
			tone="amber"
			statusLabel="In review"
			icon={PendingIcon}
			title="Application under review"
			description="Thanks for applying. Our team is reviewing your application, which can take up to 3 business days."
			next={[
				"Our team checks your documents and details.",
				"We notify you once a decision has been made. You do not need to do anything else.",
				"When you are approved, you can switch on availability and accept orders.",
			]}
			actions={
				<Button icon={RetryIcon} loading={checking} onPress={() => void checkStatus()} fullWidth>
					{checking ? "Checking" : "Check status"}
				</Button>
			}
		/>
	);
}
