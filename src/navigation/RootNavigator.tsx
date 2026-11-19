import React from "react";
import { createStackNavigator, TransitionPresets } from "@react-navigation/stack";
import withAuthCheck from "./withAuthCheck";
import type { RootRouteName, RootStackParamList } from "./types";

import SignInScreen from "@/features/auth/screens/SignInScreen";
import SignUpScreen from "@/features/auth/screens/SignUpScreen";
import ForgotPasswordScreen from "@/features/auth/screens/ForgotPasswordScreen";
import HomeRedirectScreen from "./HomeRedirectScreen";
import CustomerTabs from "./CustomerTabs";
import ProviderTabs from "./ProviderTabs";
import ProviderDetailsScreen from "@/features/onboarding/screens/ProviderDetailsScreen";
import AccountApprovalScreen from "@/features/onboarding/screens/AccountApprovalScreen";
import AccountRejectedScreen from "@/features/onboarding/screens/AccountRejectedScreen";
import AccountPendingScreen from "@/features/onboarding/screens/AccountPendingScreen";
import BookingPaymentScreen from "@/features/booking/screens/BookingPaymentScreen";
import BookingDetailsScreen from "@/features/bookings/screens/BookingDetailsScreen";
import AcceptOrderScreen from "@/features/orders/screens/AcceptOrderScreen";
import MyOrdersScreen from "@/features/orders/screens/MyOrdersScreen";
import MyOrderDetailsScreen from "@/features/orders/screens/MyOrderDetailsScreen";
import StripeWebViewScreen from "@/features/earnings/screens/StripeWebViewScreen";
import EarningsScreen from "@/features/earnings/screens/EarningsScreen";
import ProfileScreen from "@/features/profile/screens/ProfileScreen";
import ReceiptScreen from "@/features/receipt/screens/ReceiptScreen";
import NotificationsScreen from "@/features/notifications/screens/NotificationsScreen";
import DesignSystemScreen from "@/ui/DesignSystemScreen";
import OnboardingPreviewScreen from "@/features/onboarding/screens/OnboardingPreviewScreen";

const Stack = createStackNavigator<RootStackParamList>();

const CustomerSignUp = () => <SignUpScreen role="user" />;
const ProviderSignUp = () => <SignUpScreen role="provider" />;

// Signed-in screens are gated exactly once, here, at module scope (so each wrapped component keeps its identity).
// The gate sends signed-out users to Login and passes `userDetails` to the screen. Tab screens inside the shells
// are covered by the shell's gate; screens read the user with useAuthCheck().
const gated = {
	Home: withAuthCheck(HomeRedirectScreen),
	ProviderDetails: withAuthCheck(ProviderDetailsScreen),
	AccountApproval: withAuthCheck(AccountApprovalScreen),
	AccountRejected: withAuthCheck(AccountRejectedScreen),
	AccountPending: withAuthCheck(AccountPendingScreen),
	CustomerHome: withAuthCheck(CustomerTabs),
	ProviderHome: withAuthCheck(ProviderTabs),
	BookingPayment: withAuthCheck(BookingPaymentScreen),
	BookingDetails: withAuthCheck(BookingDetailsScreen),
	AcceptOrder: withAuthCheck(AcceptOrderScreen),
	MyOrders: withAuthCheck(MyOrdersScreen),
	MyOrderDetails: withAuthCheck(MyOrderDetailsScreen),
	WebView: withAuthCheck(StripeWebViewScreen),
	Earnings: withAuthCheck(EarningsScreen),
	Profile: withAuthCheck(ProfileScreen),
	Receipt: withAuthCheck(ReceiptScreen),
	Notifications: withAuthCheck(NotificationsScreen),
};

/** Every route of the app. Add the route to navigation/types.ts first, then register it here. */
export default function RootNavigator({ initialRouteName }: { initialRouteName: RootRouteName }) {
	return (
		<Stack.Navigator
			initialRouteName={initialRouteName}
			screenOptions={{ headerShown: false, gestureEnabled: true, ...TransitionPresets.SlideFromRightIOS }}
		>
			<Stack.Group screenOptions={TransitionPresets.FadeFromBottomAndroid}>
				<Stack.Screen name="Login" component={SignInScreen} />
				<Stack.Screen name="Signup" component={CustomerSignUp} />
				<Stack.Screen name="ProviderSignup" component={ProviderSignUp} />
				<Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
			</Stack.Group>

			<Stack.Group screenOptions={TransitionPresets.FadeFromBottomAndroid}>
				<Stack.Screen name="Home" component={gated.Home} />
				<Stack.Screen name="CustomerHome" component={gated.CustomerHome} />
				<Stack.Screen name="ProviderHome" component={gated.ProviderHome} />
				<Stack.Screen name="ProviderDetails" component={gated.ProviderDetails} />
				<Stack.Screen name="AccountApproval" component={gated.AccountApproval} />
				<Stack.Screen name="AccountRejected" component={gated.AccountRejected} />
				<Stack.Screen name="AccountPending" component={gated.AccountPending} />
			</Stack.Group>

			<Stack.Screen name="BookingPayment" component={gated.BookingPayment} />
			<Stack.Screen name="BookingDetails" component={gated.BookingDetails} />
			<Stack.Screen name="AcceptOrder" component={gated.AcceptOrder} />
			<Stack.Screen name="MyOrders" component={gated.MyOrders} />
			<Stack.Screen name="MyOrderDetails" component={gated.MyOrderDetails} />
			<Stack.Screen name="WebView" component={gated.WebView} />
			<Stack.Screen name="Earnings" component={gated.Earnings} />
			<Stack.Screen name="Profile" component={gated.Profile} />
			<Stack.Screen name="Receipt" component={gated.Receipt} />
			<Stack.Screen name="Notifications" component={gated.Notifications} />
			{__DEV__ ? <Stack.Screen name="DesignSystem" component={DesignSystemScreen} /> : null}
			{__DEV__ ? <Stack.Screen name="DevOnboarding" component={OnboardingPreviewScreen} /> : null}
		</Stack.Navigator>
	);
}
