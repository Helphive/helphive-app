import React from "react";
import type { RootScreenProps } from "@/navigation/types";
import ProviderDetailsScreen from "./ProviderDetailsScreen";
import AccountPendingScreen from "./AccountPendingScreen";
import AccountApprovalScreen from "./AccountApprovalScreen";
import AccountRejectedScreen from "./AccountRejectedScreen";

/**
 * Dev builds only: the onboarding screens without an account in that state, and without sending anything
 * (helphive://dev/onboarding/details | pending | approved | rejected).
 */
export default function OnboardingPreviewScreen({ route }: RootScreenProps<"DevOnboarding">) {
	switch (route.params.screen) {
		case "details":
			return <ProviderDetailsScreen preview />;
		case "pending":
			return <AccountPendingScreen preview />;
		case "approved":
			return <AccountApprovalScreen preview />;
		case "rejected":
			return (
				<AccountRejectedScreen
					preview
					previewReason="The DBS certificate is older than three years. Upload a certificate issued in the last three years."
				/>
			);
	}
}
