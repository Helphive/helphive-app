import React from "react";
import ProfileForm from "@/features/profile/components/ProfileForm";
import { useAuthCheck } from "@/features/auth/useAuthCheck";

/** The profile editor: the customer's Profile tab and the provider's Profile screen. */
export default function ProfileScreen() {
	const { userDetails } = useAuthCheck();
	if (!userDetails) return null;
	return <ProfileForm userDetails={userDetails} />;
}
