import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Button, ErrorState, Logo, Screen, Text, color, space } from "@/ui";
import { LogoutIcon } from "@/ui/icons";
import { getHomeRoute } from "@/features/auth/session";
import { useAuthCheck } from "@/features/auth/useAuthCheck";
import { useSignOut } from "@/features/auth/useAuthActions";

/**
 * Entry point after sign-in, and the fallback on a cold start that could not load the account: sends each role
 * home. It shows a loading state while the account loads, and a retry (or sign out) when it cannot be loaded or
 * its role is not one the app serves.
 */
export default function HomeRedirectScreen() {
	const navigation = useNavigation();
	const { userDetails, isUserDetailsFetching, isUserDetailsError, refetch } = useAuthCheck();
	const { signOut, isLoading: signingOut } = useSignOut();
	const route = userDetails ? getHomeRoute(userDetails) : null;

	useEffect(() => {
		if (route) navigation.reset({ index: 0, routes: [{ name: route }] });
	}, [navigation, route]);

	const failed = !route && !isUserDetailsFetching && (isUserDetailsError || !!userDetails);

	return (
		<Screen contentStyle={styles.content}>
			<View style={styles.logo}>
				<Logo size={32} />
			</View>
			{failed ? (
				<>
					<ErrorState
						title={userDetails ? "This account cannot use the app" : "Could not load your account"}
						message={
							userDetails
								? "Your account has no customer or provider access. Contact support, or sign in with another account."
								: "Check your connection and try again."
						}
						onRetry={userDetails ? undefined : () => void refetch()}
					/>
					<Button variant="text" icon={LogoutIcon} loading={signingOut} onPress={() => void signOut()}>
						Sign out
					</Button>
				</>
			) : (
				<View style={styles.loading} accessibilityLiveRegion="polite">
					<ActivityIndicator color={color.ink900} />
					<Text variant="ui" color="ink600">
						Opening your account
					</Text>
				</View>
			)}
		</Screen>
	);
}

const styles = StyleSheet.create({
	content: { flexGrow: 1, justifyContent: "center", gap: space[5] },
	logo: { alignItems: "center" },
	loading: { alignItems: "center", gap: space[3] },
});
