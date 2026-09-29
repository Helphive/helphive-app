import React from "react";
import { useDispatch } from "react-redux";
import { logOut } from "../../../features/auth/authSlice";
import { useLogoutMutation } from "../../../features/auth/authApiSlice";
import { deleteRefreshToken, getRefreshToken } from "../../../app/securestore/secureStoreUtility";
import AccountStatusLayout from "./components/AccountStatusLayout";

const paper = require("../../../../assets/icons/approval-screens/paper.png");

const AccountPendingScreen = () => {
	const dispatch = useDispatch();
	const [logout, { error, isLoading }] = useLogoutMutation();

	const handleLogout = async () => {
		try {
			const refreshToken = await getRefreshToken();
			await logout({ refreshToken: refreshToken }).unwrap();
			dispatch(logOut());
			await deleteRefreshToken();
		} catch (err) {
			console.error("Logout failed", err || error);
		}
	};

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
