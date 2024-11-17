import React, { FC, useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../utils/CustomTypes";
import { useAppTheme } from "../../utils/theme";

interface Props {
	userDetails: any;
}

const HomeScreen: FC<Props> = ({ userDetails }) => {
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const theme = useAppTheme();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	console.log("UserDetails: ", userDetails);

	useEffect(() => {
		if (userDetails) {
			setIsLoading(false);
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
		} else {
			setError("Failed to load user details.");
			setIsLoading(false);
		}
	}, [userDetails, navigation]);

	if (isLoading) {
		return (
			<View
				className="h-full w-full flex justify-center items-center"
				style={{ backgroundColor: theme.colors.background }}
			>
				<ActivityIndicator color={theme.colors.primary} animating={true} size="large" />
			</View>
		);
	}

	if (error) {
		return (
			<View
				className="h-full w-full flex justify-center items-center"
				style={{ backgroundColor: theme.colors.background }}
			>
				<Text style={{ color: theme.colors.error }}>
					Oops! We could not load user details. Please try again later.
				</Text>
			</View>
		);
	}

	return <View className="h-full flex justify-center items-center" />;
};

export default HomeScreen;
