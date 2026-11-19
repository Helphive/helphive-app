import { useSignOut } from "@/features/auth/useAuthActions";
import React from "react";
import AccountStatusLayout from "@/features/onboarding/components/AccountStatusLayout";

const paper = require("../../../../assets/icons/approval-screens/paper.png");

const AccountPendingScreen = () => {
	const { signOut, isLoading } = useSignOut();

	const handleLogout = signOut;

	return (
		<AccountStatusLayout
			image={paper}
			tint="#FEC84B"
			title="Your profile is under review"
			message="Thanks for applying. Our team is reviewing your submission, which can take up to 3 business days. We will notify you as soon as it is done."
			secondary={{ label: "Log out", onPress: handleLogout, loading: isLoading }}
		/>
	);
};

export default AccountPendingScreen;
