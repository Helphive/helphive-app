import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { TabBar, type TabItem } from "@/ui";
import { AvailableOrdersIcon, ChatIcon, EarningsIcon, HomeIcon } from "@/ui/icons";
import ProviderHomeScreen from "@/features/provider/screens/ProviderHomeScreen";
import OpenOrdersScreen from "@/features/orders/screens/OpenOrdersScreen";
import BalanceScreen from "@/features/earnings/screens/BalanceScreen";
import ChatScreen from "@/features/chat/screens/ChatScreen";
import type { ProviderTabParamList, RootScreenProps } from "./types";
import { useShell } from "./useShell";

const Tab = createBottomTabNavigator<ProviderTabParamList>();

const ITEMS: Record<keyof ProviderTabParamList, TabItem> = {
	HomeTab: { label: "Home", icon: HomeIcon },
	OrdersTab: { label: "Orders", icon: AvailableOrdersIcon },
	BalanceTab: { label: "Earnings", icon: EarningsIcon },
	ChatTab: { label: "Chat", icon: ChatIcon },
};

/** The provider's tab shell: shared header (logo, notifications, avatar to the profile) and the bottom tab bar. */
export default function ProviderTabs({ navigation }: RootScreenProps<"ProviderHome">) {
	const { header } = useShell(() => navigation.navigate("Profile"));
	return (
		<Tab.Navigator screenOptions={{ header }} tabBar={(props) => <TabBar {...props} items={ITEMS} />}>
			<Tab.Screen name="HomeTab" component={ProviderHomeScreen} />
			<Tab.Screen name="OrdersTab" component={OpenOrdersScreen} />
			<Tab.Screen name="BalanceTab" component={BalanceScreen} />
			<Tab.Screen name="ChatTab" component={ChatScreen} />
		</Tab.Navigator>
	);
}
