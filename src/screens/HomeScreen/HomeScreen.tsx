import React, { FC, useEffect } from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../utils/CustomTypes";

interface Props {
	userDetails: any;
}

const HomeScreen: FC<Props> = ({ userDetails }) => {
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

	useEffect(() => {
		if (userDetails?.roles?.Provider) {
			switch (userDetails.status) {
				case "inactive":
					navigation.replace("ProviderDetails");
					break;
				case "approved": {
					if (userDetails?.accountApprovalScreen) {
						navigation.replace("ProviderHome");
						break;
					} else {
						navigation.replace("AccountApproval");
						break;
					}
				}
				case "rejected":
					navigation.replace("AccountRejected");
					break;
				case "pending":
					navigation.replace("AccountPending");
					break;
				default:
					break;
			}
		} else if (userDetails?.roles?.User) {
			navigation.replace("UserHome");
		}
	}, [userDetails, navigation]);

	return <View className="h-full flex justify-center items-center" />;
};

export default HomeScreen;
