import React, { useState } from "react";
import { HelperText } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../utils/CustomTypes";
import { useAccountApprovalScreenMutation } from "../../../features/provider/providerApiSlice";
import AccountStatusLayout from "./components/AccountStatusLayout";

const checkCircle = require("../../../../assets/icons/approval-screens/check-circle.png");

type AccountApprovalScreenProps = {
	userDetails: any;
};

const AccountApprovalScreen = ({ userDetails }: AccountApprovalScreenProps) => {
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const [accountApproval, { isLoading }] = useAccountApprovalScreenMutation();
	const [accountApprovalError, setAccountApprovalError] = useState<string | null>(null);

	const beginYourJourney = async () => {
		setAccountApprovalError(null);
		try {
			await accountApproval().unwrap();
			navigation.reset({
				index: 0,
				routes: [{ name: "ProviderHome", params: { userDetails } }],
			});
		} catch (error: any) {
			console.log("Error: ", error);
			if (error?.status === "FETCH_ERROR") {
				setAccountApprovalError("Please check your internet connection.");
			} else {
				setAccountApprovalError("An error occurred while processing request.");
			}
		}
	};

	return (
		<AccountStatusLayout
			image={checkCircle}
			tint="#71BF74"
			title="You are approved!"
			message="Start accepting opportunities and connect with hotels in need today."
			primary={{ label: "Begin your journey", onPress: beginYourJourney, loading: isLoading }}
		>
			<HelperText type="error" visible={!!accountApprovalError} style={{ marginTop: 12 }}>
				{accountApprovalError}
			</HelperText>
		</AccountStatusLayout>
	);
};

export default AccountApprovalScreen;
