import React, { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Provider as StoreProvider } from "react-redux";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { StripeProvider } from "@stripe/stripe-react-native";

import store from "@/store";
import { SystemChrome, ThemeProvider, ToastProvider, loadThemePreference, useNavigationTheme, useTheme } from "@/ui";
import type { ThemePreference } from "@/ui";
import { PermissionProvider } from "@/services/permissions";
import { initializePush, onPushOpened } from "@/services/push";
import { startSessionServices } from "@/features/chat/sessionServices";
import { installErrorReporting } from "@/services/errorReporting";
import { getClientPass } from "@/services/api/clientPass";
import { bootstrapSession } from "@/features/auth/session";
import { openFromPush } from "@/features/notifications/openFromPush";
import RootNavigator from "@/navigation/RootNavigator";
import { linking } from "@/navigation/linking";
import type { RootRouteName, RootStackParamList } from "@/navigation/types";

// Keep the native splash up until the appearance choice, the fonts and the first session check are all ready.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 300, fade: true });

// OneSignal starts before the first render (it asks for no permission), so a notification tap that launched the app is
// delivered. Chat and push sign-in for the session start after the first screen: see onReady.
initializePush();

const navigationRef = createNavigationContainerRef<RootStackParamList>();
installErrorReporting(() => navigationRef.getCurrentRoute()?.name);

// Get the client pass (see clientPass.ts) while the app starts, so the first requests already carry it. Never awaited.
void getClientPass();

const FONTS = {
	jakartaRegular: require("./assets/fonts/PlusJakartaSans/static/PlusJakartaSans-Regular.ttf"),
	jakartaMedium: require("./assets/fonts/PlusJakartaSans/static/PlusJakartaSans-Medium.ttf"),
	jakartaSemiBold: require("./assets/fonts/PlusJakartaSans/static/PlusJakartaSans-SemiBold.ttf"),
	jakartaBold: require("./assets/fonts/PlusJakartaSans/static/PlusJakartaSans-Bold.ttf"),
	jakartaExtraBold: require("./assets/fonts/PlusJakartaSans/static/PlusJakartaSans-ExtraBold.ttf"),
};

// What the first screen waits for, all started at launch together rather than one after another. A font that fails to
// load falls back to the system font; a failed session check opens Home, which retries.
const startup = Promise.all([
	loadThemePreference(),
	Font.loadAsync(FONTS).catch((error) => console.error("Fonts failed to load:", error)),
	bootstrapSession().catch((error): RootRouteName => {
		console.error("Session bootstrap failed:", error);
		return "Home";
	}),
]);

/** Waits for the appearance choice, fonts and first route (the splash stays up), then renders the app in them. */
export default function App() {
	const [ready, setReady] = useState<{ preference: ThemePreference; initialRoute: RootRouteName } | null>(null);
	useEffect(() => {
		startup.then(([preference, , initialRoute]) => setReady({ preference, initialRoute }));
	}, []);
	if (!ready) return null;
	return (
		<ThemeProvider initialPreference={ready.preference}>
			<AppContent initialRoute={ready.initialRoute} />
		</ThemeProvider>
	);
}

/** Providers and the navigator. Screens live in src/features; routes in src/navigation. */
function AppContent({ initialRoute }: { initialRoute: RootRouteName }) {
	const { color } = useTheme();
	const navigationTheme = useNavigationTheme();

	useEffect(() => onPushOpened((event) => openFromPush(event.notification.additionalData, navigationRef)), []);

	const onReady = useCallback(() => {
		SplashScreen.hideAsync().catch(() => {});
		// The session's chat and push sign-in (CometChat, OneSignal) start once the first screen is up, so they never
		// hold the splash. startSessionServices runs once and then follows sign-in and sign-out by itself.
		requestIdleCallback(() => startSessionServices());
	}, []);

	return (
		<GestureHandlerRootView style={{ flex: 1, backgroundColor: color.canvas }}>
			<SafeAreaProvider>
				<SystemChrome />
				<StoreProvider store={store}>
					<StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""}>
						<ToastProvider>
							<PermissionProvider>
								<NavigationContainer
									ref={navigationRef}
									linking={linking}
									theme={navigationTheme}
									onReady={onReady}
								>
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
