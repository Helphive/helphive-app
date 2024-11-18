import React, { createRef, FC, useCallback, useEffect } from "react";
import { Easing } from "react-native";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Provider as StoreProvider } from "react-redux";
import { PaperProvider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator, TransitionPresets } from "@react-navigation/stack";

import store from "./src/app/store";
import paperTheme from "./src/utils/theme";
import { RootStackParamList } from "./src/utils/CustomTypes";
import { initializeOneSignal } from "./src/app/onesignal/OneSignalSetup";
import { StripeProvider } from "@stripe/stripe-react-native";

import LoginScreen from "./src/screens/LoginScreen/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen/SignupScreen";
import ProviderSignupScreen from "./src/screens/ProviderSingupScreen/ProviderSignupScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen/ForgotPasswordScreen";
import HomeScreen from "./src/screens/HomeScreen/HomeScreen";
import ProviderDetailsScreen from "./src/screens/HomeScreen/ProviderDetails/ProviderDetailsScreen";
import AccountApprovalScreen from "./src/screens/HomeScreen/ProviderDetails/AccountApprovalScreen";
import AccountRejectedScreen from "./src/screens/HomeScreen/ProviderDetails/AccountRejectedScreen";
import AccountPendingScreen from "./src/screens/HomeScreen/ProviderDetails/AccountPendingScreen";
import ProviderHomeScreen from "./src/screens/HomeScreen/ProviderHomeScreen";
import UserHomeScreen from "./src/screens/HomeScreen/UserHomeScreen";
import BookingPayment from "./src/screens/HomeScreen/UserTabs/Bookings/screens/BookingPayment";
import BookingDetails from "./src/screens/HomeScreen/UserTabs/Bookings/screens/BookingDetails";
import AcceptOrder from "./src/screens/HomeScreen/ProviderTabs/Orders/screens/AcceptOrder";
import ProviderProfile from "./src/screens/HomeScreen/ProviderTabs/Home/screens/ProviderProfile";

import withAuthCheck from "./src/hocs/withAuthCheck";
import MyOrders from "./src/screens/HomeScreen/ProviderTabs/Orders/screens/MyOrders";
import { OneSignal } from "react-native-onesignal";
import MyOrderDetails from "./src/screens/HomeScreen/ProviderTabs/Orders/screens/MyOrderDetails";

const Stack = createStackNavigator<RootStackParamList>();

const App: FC = () => {
	const [fontsLoaded] = Font.useFonts({
		jakartaRegular: require("./assets/fonts/PlusJakartaSans/static/PlusJakartaSans-Regular.ttf"),
		jakartaMedium: require("./assets/fonts/PlusJakartaSans/static/PlusJakartaSans-Medium.ttf"),
		jakartaSemiBold: require("./assets/fonts/PlusJakartaSans/static/PlusJakartaSans-SemiBold.ttf"),
		jakartaBold: require("./assets/fonts/PlusJakartaSans/static/PlusJakartaSans-Bold.ttf"),
	});

	const navigationRef: any = createRef();

	SplashScreen.setOptions({
		duration: 500,
		fade: true,
	});

	useEffect(() => {
		SplashScreen.preventAutoHideAsync();
	}, []);

	const onLayoutRootView = useCallback(async () => {
		if (fontsLoaded) {
			await SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	useEffect(() => {
		initializeOneSignal();
	}, []);

	useEffect(() => {
		const handleNotification = (notification: any) => {
			const screen = notification?.notification?.additionalData?.screen;
			const bookingId = notification?.notification?.additionalData?.bookingId;
			console.log(screen, bookingId);
			if (screen && bookingId && navigationRef.current) {
				setTimeout(() => {
					navigationRef.current.navigate(screen, { bookingId });
				}, 100);
			}
		};

		OneSignal.Notifications.addEventListener("click", handleNotification);
		OneSignal.Notifications.addEventListener("foregroundWillDisplay", handleNotification);

		return () => {
			OneSignal.Notifications.removeEventListener("click", handleNotification);
			OneSignal.Notifications.removeEventListener("foregroundWillDisplay", handleNotification);
		};
	}, [navigationRef]);

	if (!fontsLoaded) {
		return null;
	}

	const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

	return (
		<NavigationContainer ref={navigationRef} onReady={onLayoutRootView}>
			<StoreProvider store={store}>
				<PaperProvider theme={paperTheme}>
					<StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
						<Stack.Navigator
							initialRouteName="Home"
							screenOptions={{
								headerShown: false,
								gestureEnabled: true,
								transitionSpec: {
									open: {
										animation: "timing",
										config: {
											duration: 350,
											easing: Easing.out(Easing.poly(4)),
										},
									},
									close: {
										animation: "timing",
										config: {
											duration: 300,
											easing: Easing.in(Easing.poly(4)),
										},
									},
								},
								cardStyleInterpolator: ({ current, layouts }) => {
									return {
										cardStyle: {
											transform: [
												{
													translateX: current.progress.interpolate({
														inputRange: [0, 1],
														outputRange: [layouts.screen.width, 0],
													}),
												},
											],
										},
										overlayStyle: {
											opacity: current.progress.interpolate({
												inputRange: [0, 1],
												outputRange: [0, 0.3],
											}),
										},
									};
								},
							}}
						>
							<Stack.Screen
								name="Login"
								component={LoginScreen}
								options={{
									...TransitionPresets.ModalSlideFromBottomIOS,
								}}
							/>
							<Stack.Screen
								name="Signup"
								component={SignupScreen}
								options={{
									...TransitionPresets.ModalSlideFromBottomIOS,
								}}
							/>
							<Stack.Screen
								name="ProviderSignup"
								component={ProviderSignupScreen}
								options={{
									...TransitionPresets.ModalSlideFromBottomIOS,
								}}
							/>
							<Stack.Screen
								name="ForgotPassword"
								component={ForgotPasswordScreen}
								options={{
									...TransitionPresets.ModalPresentationIOS,
								}}
							/>
							<Stack.Screen
								name="Home"
								component={withAuthCheck(HomeScreen)}
								options={{
									...TransitionPresets.DefaultTransition,
								}}
							/>
							<Stack.Screen
								name="ProviderDetails"
								component={withAuthCheck(ProviderDetailsScreen)}
								options={{
									...TransitionPresets.FadeFromBottomAndroid,
								}}
							/>
							<Stack.Screen
								name="AccountApproval"
								component={withAuthCheck(AccountApprovalScreen)}
								options={{
									...TransitionPresets.SlideFromRightIOS,
								}}
							/>
							<Stack.Screen
								name="AccountRejected"
								component={withAuthCheck(AccountRejectedScreen)}
								options={{
									...TransitionPresets.SlideFromRightIOS,
								}}
							/>
							<Stack.Screen
								name="AccountPending"
								component={withAuthCheck(AccountPendingScreen)}
								options={{
									...TransitionPresets.SlideFromRightIOS,
								}}
							/>
							<Stack.Screen
								name="ProviderHome"
								component={withAuthCheck(ProviderHomeScreen)}
								options={{
									...TransitionPresets.DefaultTransition,
								}}
							/>
							<Stack.Screen
								name="UserHome"
								component={withAuthCheck(UserHomeScreen)}
								options={{
									...TransitionPresets.DefaultTransition,
								}}
							/>
							<Stack.Screen
								name="BookingPayment"
								component={withAuthCheck(BookingPayment)}
								options={{
									...TransitionPresets.SlideFromRightIOS,
								}}
							/>
							<Stack.Screen
								name="BookingDetails"
								component={withAuthCheck(BookingDetails)}
								options={{
									...TransitionPresets.ScaleFromCenterAndroid,
								}}
							/>
							<Stack.Screen
								name="AcceptOrder"
								component={withAuthCheck(AcceptOrder)}
								options={{
									...TransitionPresets.ModalPresentationIOS,
								}}
							/>
							<Stack.Screen
								name="MyOrders"
								component={withAuthCheck(MyOrders)}
								options={{
									...TransitionPresets.SlideFromRightIOS,
								}}
							/>
							<Stack.Screen
								name="MyOrderDetails"
								component={withAuthCheck(MyOrderDetails)}
								options={{
									...TransitionPresets.SlideFromRightIOS,
								}}
							/>
							<Stack.Screen
								name="ProviderProfile"
								component={withAuthCheck(ProviderProfile)}
								options={{
									...TransitionPresets.SlideFromRightIOS,
								}}
							/>
						</Stack.Navigator>
					</StripeProvider>
				</PaperProvider>
			</StoreProvider>
		</NavigationContainer>
	);
};

export default App;
