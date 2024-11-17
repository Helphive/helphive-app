import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
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
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const dispatch = useDispatch();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const refreshToken = useSelector(selectCurrentRefreshToken);

	useEffect(() => {
		const checkRefreshToken = async () => {
			try {
				const storedRefreshToken = await getRefreshToken();
				if (storedRefreshToken) {
					dispatch(setCredentials({ refreshToken: storedRefreshToken }));
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
				setError("Failed to refresh token. Please try again.");
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

		if (!refreshToken) {
			checkRefreshToken();
		} else {
			setIsLoading(false);
		}
	}, [dispatch, navigation, refreshToken]);

	useEffect(() => {
		if (!refreshToken) {
			navigation.reset({
				index: 0,
				routes: [{ name: "Login" }],
			});
		}
	}, [refreshToken, navigation]);

	useEffect(() => {
		refetch().catch(() => {
			setError("Failed to fetch user details. Please try again.");
			setIsLoading(false);
		});
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

	if (error) {
		return (
			<SafeAreaView
				className="h-full w-full flex justify-center items-center"
				style={{ backgroundColor: theme.colors.background }}
			>
				<Text style={{ color: theme.colors.error }}>
					Oops! We could not reach the servers. Please try again later.
				</Text>
			</SafeAreaView>
		);
	}

	return <Component {...props} userDetails={userDetails} />;
};

export default withAuthCheck;
