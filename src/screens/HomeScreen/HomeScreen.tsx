import React, { FC, useEffect } from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../utils/CustomTypes";
import { useAppTheme } from "../../utils/theme";
import { getHomeRoute } from "../../app/session";
import { useAuthCheck } from "../../hocs/hooks/useAuthCheck";
import ErrorRetry from "../../components/details/ErrorRetry";

interface Props {
	userDetails: any;
}

// Entry point after login (and the fallback on a cold start that could not load the user): sends each role home.
// There is no loader here. The auth gate waits for the user details, and this screen only renders without them
// when loading failed, so it offers a retry.
const HomeScreen: FC<Props> = ({ userDetails }) => {
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const theme = useAppTheme();
	const { refetch } = useAuthCheck();

	useEffect(() => {
		const route = getHomeRoute(userDetails);
		if (route) navigation.replace(route as any);
	}, [userDetails, navigation]);

	if (!userDetails) {
		return (
			<View className="h-full w-full flex justify-center" style={{ backgroundColor: theme.colors.background }}>
				<ErrorRetry message="Failed to load user details." onRetry={() => refetch()} />
			</View>
		);
	}

	return <View className="h-full flex justify-center items-center" />;
};

export default HomeScreen;
