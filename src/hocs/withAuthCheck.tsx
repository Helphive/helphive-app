import React, { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthCheck } from "./hooks/useAuthCheck";
import { useAppTheme } from "../utils/theme";
import { deleteRefreshToken, getRefreshToken } from "../app/securestore/secureStoreUtility";
import { logOut, selectCurrentRefreshToken, setCredentials } from "../features/auth/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../utils/CustomTypes";
import { useNavigation } from "@react-navigation/native";

const withAuthCheck = (Component: React.ComponentType<any>) => (props: any) => {
	const theme = useAppTheme();
	const { userDetails, refetch } = useAuthCheck();
	const [isTokenChecked, setIsTokenChecked] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const dispatch = useDispatch();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const refreshToken = useSelector(selectCurrentRefreshToken);

	useEffect(() => {
		const checkRefreshToken = async () => {
			try {
				const storedRefreshToken = await getRefreshToken();
				if (storedRefreshToken) {
					dispatch(setCredentials({ refreshToken: storedRefreshToken }));
					setIsTokenChecked(true);
				} else {
					await deleteRefreshToken();
					dispatch(logOut());
					navigation.reset({
						index: 0,
						routes: [{ name: "Login" }],
					});
				}
			} catch (error) {
				console.error("Error refreshing token:", error);
				await deleteRefreshToken();
				dispatch(logOut());
				navigation.reset({
					index: 0,
					routes: [{ name: "Login" }],
				});
			} finally {
				setIsLoading(false);
			}
		};

		if (!refreshToken && !isTokenChecked) {
			checkRefreshToken();
		} else {
			setIsTokenChecked(true);
		}
	}, [dispatch, navigation, refreshToken]);

	useEffect(() => {
		if (!refreshToken && isTokenChecked) {
			navigation.reset({
				index: 0,
				routes: [{ name: "Login" }],
			});
		}
	}, [refreshToken, isTokenChecked, navigation]);

	useEffect(() => {
		refetch().then(() => setIsLoading(false));
	}, [refetch]);

	if (isLoading) {
		return (
			<SafeAreaView
				className="h-full w-full flex justify-center items-center"
				style={{ backgroundColor: theme.colors.background }}
			>
				<ActivityIndicator color={theme.colors.primary} animating={true} size="large" />
			</SafeAreaView>
		);
	}

	return <Component {...props} userDetails={userDetails} />;
};

export default withAuthCheck;
