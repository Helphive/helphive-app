import React, { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Provider as StoreProvider } from "react-redux";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { StripeProvider } from "@stripe/stripe-react-native";
import { StatusBar } from "expo-status-bar";

import store from "@/store";
import { ToastProvider } from "@/ui";
import { PermissionProvider } from "@/services/permissions";
import { initializePush, onPushOpened } from "@/services/push";
import { startSessionServices } from "@/features/chat/sessionServices";
import { installErrorReporting } from "@/services/errorReporting";
import { bootstrapSession } from "@/features/auth/session";
import { openFromPush } from "@/features/notifications/openFromPush";
import RootNavigator from "@/navigation/RootNavigator";
import { linking } from "@/navigation/linking";
import type { RootRouteName, RootStackParamList } from "@/navigation/types";

// Keep the native splash up until fonts are loaded and the first session check is done.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 300, fade: true });

// Native SDKs start once per process, before the first render. Neither asks for a permission.
initializePush();
startSessionServices();

const navigationRef = createNavigationContainerRef<RootStackParamList>();
installErrorReporting(() => navigationRef.getCurrentRoute()?.name);

const FONTS = {
	jakartaRegular: require("./assets/fonts/PlusJakartaSans/static/PlusJakartaSans-Regular.ttf"),
	jakartaMedium: require("./assets/fonts/PlusJakartaSans/static/PlusJakartaSans-Medium.ttf"),
	jakartaSemiBold: require("./assets/fonts/PlusJakartaSans/static/PlusJakartaSans-SemiBold.ttf"),
	jakartaBold: require("./assets/fonts/PlusJakartaSans/static/PlusJakartaSans-Bold.ttf"),
	jakartaExtraBold: require("./assets/fonts/PlusJakartaSans/static/PlusJakartaSans-ExtraBold.ttf"),
};

/** Providers and the navigator. Screens live in src/features; routes in src/navigation. */
export default function App() {
	const [fontsLoaded] = Font.useFonts(FONTS);
	const [initialRoute, setInitialRoute] = useState<RootRouteName | null>(null);

	useEffect(() => {
		bootstrapSession()
			.then(setInitialRoute)
			.catch((error) => {
				console.error("Session bootstrap failed:", error);
				setInitialRoute("Home");
			});
	}, []);

	useEffect(() => onPushOpened((event) => openFromPush(event.notification.additionalData, navigationRef)), []);

	const onReady = useCallback(() => {
		if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
	}, [fontsLoaded]);

	if (!fontsLoaded || !initialRoute) return null;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<StatusBar style="dark" />
				<StoreProvider store={store}>
					<StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""}>
						<ToastProvider>
							<PermissionProvider>
								<NavigationContainer ref={navigationRef} linking={linking} onReady={onReady}>
									<RootNavigator initialRouteName={initialRoute} />
								</NavigationContainer>
							</PermissionProvider>
						</ToastProvider>
					</StripeProvider>
				</StoreProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
