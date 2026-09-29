import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../utils/CustomTypes";
import { useAppTheme } from "../../../utils/theme";
import AccountStatusLayout from "./components/AccountStatusLayout";

const xOctagon = require("../../../../assets/icons/approval-screens/x-octagon.png");

type AccountRejectedScreenProps = {
	userDetails: any;
};

const AccountRejectedScreen = ({ userDetails }: AccountRejectedScreenProps) => {
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const theme = useAppTheme();

	return (
		<AccountStatusLayout
			image={xOctagon}
			tint="#F6564A"
			title="Your submission was not approved"
			message="You can revise and resubmit your profile at any time. Here is the note from our reviewer."
			primary={{
				label: "Try again",
				onPress: () =>
					navigation.reset({ index: 0, routes: [{ name: "ProviderDetails", params: { userDetails } }] }),
			}}
		>
			<View
				style={{
					marginTop: 20,
					padding: 16,
					borderRadius: 12,
					backgroundColor: "#FEF3F2",
					maxWidth: 340,
					width: "100%",
				}}
			>
				<Text style={{ fontFamily: theme.colors.fontSemiBold, color: "#B42318", marginBottom: 4 }}>
					Reviewer note
				</Text>
				<Text style={{ color: "#B42318" }}>{userDetails?.rejectReason || "No reason provided"}</Text>
			</View>
		</AccountStatusLayout>
	);
};

export default AccountRejectedScreen;
