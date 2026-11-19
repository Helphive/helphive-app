import type { NavigatorScreenParams } from "@react-navigation/native";
import type { StackNavigationProp, StackScreenProps } from "@react-navigation/stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

/**
 * Every route in the app and its params. Route names are part of the push-notification contract
 * (`additionalData.screen` is one of BookingDetails, MyOrderDetails, AcceptOrder, Earnings, Chat), so do not rename
 * those. Add a screen here first, then register it in RootNavigator.
 */
export type CustomerTabParamList = {
	BookTab: undefined;
	BookingsTab: { tab?: "active" | "scheduled" | "history" } | undefined;
	ChatTab: { uid?: string } | undefined;
	ProfileTab: undefined;
};

export type ProviderTabParamList = {
	HomeTab: undefined;
	OrdersTab: undefined;
	BalanceTab: { refresh?: string } | undefined;
	ChatTab: { uid?: string } | undefined;
};

export type RootStackParamList = {
	// Signed out
	Login: undefined;
	Signup: undefined;
	ProviderSignup: undefined;
	ForgotPassword: undefined;
	// Decides where a signed-in user belongs
	Home: undefined;
	// Provider onboarding
	ProviderDetails: undefined;
	AccountApproval: undefined;
	AccountRejected: undefined;
	AccountPending: undefined;
	// Tab shells
	CustomerHome: NavigatorScreenParams<CustomerTabParamList> | undefined;
	ProviderHome: NavigatorScreenParams<ProviderTabParamList> | undefined;
	// Customer
	BookingPayment: undefined;
	BookingDetails: { bookingId: string };
	// Provider
	AcceptOrder: { bookingId: string };
	MyOrders: undefined;
	MyOrderDetails: { bookingId: string };
	WebView: { url: string; title?: string };
	Earnings: undefined;
	// Shared
	Profile: undefined;
	Receipt: { bookingId: string };
	Notifications: undefined;
	// Dev builds only: every design-system component with an example (helphive://dev/ui).
	DesignSystem: undefined;
	// Dev builds only: onboarding screens in any state, sending nothing (helphive://dev/onboarding/<screen>).
	DevOnboarding: { screen: "details" | "pending" | "approved" | "rejected" };
};

export type RootRouteName = keyof RootStackParamList;
export type RootNavigation = StackNavigationProp<RootStackParamList>;
export type RootScreenProps<T extends RootRouteName> = StackScreenProps<RootStackParamList, T>;
export type CustomerTabProps<T extends keyof CustomerTabParamList> = BottomTabScreenProps<CustomerTabParamList, T>;
export type ProviderTabProps<T extends keyof ProviderTabParamList> = BottomTabScreenProps<ProviderTabParamList, T>;

// Types `useNavigation()` everywhere without passing the param list.
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace ReactNavigation {
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface RootParamList extends RootStackParamList {}
	}
}
