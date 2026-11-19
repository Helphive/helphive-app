import React from "react";
import { useNavigation } from "@react-navigation/native";
import { ErrorState, ListSkeleton, Screen, ScreenHeader } from "@/ui";
import { useAuthCheck } from "@/features/auth/useAuthCheck";
import ProfileForm from "../components/ProfileForm";

/** The profile editor: the customer's Profile tab and the provider's Profile screen. */
export default function ProfileScreen() {
	const { userDetails, isUserDetailsLoading, isUserDetailsFetching, refetch } = useAuthCheck();
	// The customer's Profile tab is a tab, not a pushed screen: no back arrow there.
	const inTabs = useNavigation().getState()?.type === "tab";
	const header = <ScreenHeader title="Profile" back={inTabs ? false : undefined} />;
	if (userDetails) return <ProfileForm details={userDetails} header={header} />;
	return (
		<Screen header={header}>
			{isUserDetailsLoading ? (
				<ListSkeleton rows={6} />
			) : (
				<ErrorState
					title="Could not load your profile"
					message="Check your connection and try again."
					onRetry={() => void refetch()}
					retrying={isUserDetailsFetching}
				/>
			)}
		</Screen>
	);
}
