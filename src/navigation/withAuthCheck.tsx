import React, { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthCheck } from "@/features/auth/useAuthCheck";
import { useAppTheme } from "@/ui/paperTheme";
import { restoreRefreshToken } from "@/features/auth/session";
import { selectCurrentRefreshToken } from "@/features/auth/slice";
import { useDispatch, useSelector } from "react-redux";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/navigation/types";
import { useNavigation } from "@react-navigation/native";

/**
 * Gives a screen the signed-in user's details and sends signed-out users to Login.
 *
 * It never hides a screen while it has data: cached user details render at once and are refreshed in the background
 * (a failed refresh keeps the cached screen). The loader only shows when there is nothing to show yet.
 *
 * Call it once per screen, at module scope, so the wrapped component keeps the same identity between renders.
 */
const withAuthCheck = (Component: React.ComponentType<any>) => {
	const AuthChecked = (props: any) => {
		const theme = useAppTheme();
		const { userDetails, isUserDetailsError } = useAuthCheck();
		const [isTokenChecked, setIsTokenChecked] = useState(false);

		const dispatch = useDispatch();
		const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
		const refreshToken = useSelector(selectCurrentRefreshToken);

		// The store has no refresh token yet (cold start before it was restored): look in secure storage.
		useEffect(() => {
			if (refreshToken || isTokenChecked) {
				setIsTokenChecked(true);
				return;
			}
			let cancelled = false;
			restoreRefreshToken(dispatch).then(() => {
				if (!cancelled) setIsTokenChecked(true);
			});
			return () => {
				cancelled = true;
			};
		}, [dispatch, refreshToken, isTokenChecked]);

		// No refresh token after the check (never signed in, or signed out): go to Login.
		useEffect(() => {
			if (!refreshToken && isTokenChecked) {
				navigation.reset({
					index: 0,
					routes: [{ name: "Login" }],
				});
			}
		}, [refreshToken, isTokenChecked, navigation]);

		// A failed request with nothing cached still renders the screen, so it can show its own retry state.
		if (userDetails || (refreshToken && isUserDetailsError)) {
			return <Component {...props} userDetails={userDetails} />;
		}

		return (
			<SafeAreaView
				className="h-full w-full flex justify-center items-center"
				style={{ backgroundColor: theme.colors.background }}
			>
				<ActivityIndicator color={theme.colors.primary} animating={true} size="large" />
			</SafeAreaView>
		);
	};

	AuthChecked.displayName = `withAuthCheck(${Component.displayName || Component.name || "Component"})`;
	return AuthChecked;
};

export default withAuthCheck;
