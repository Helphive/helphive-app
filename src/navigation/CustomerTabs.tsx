import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { TabBar, type TabItem } from "@/ui";
import { BookingsIcon, ChatIcon, HomeIcon, ProfileIcon } from "@/ui/icons";
import BookServiceScreen from "@/features/booking/screens/BookServiceScreen";
import BookingsScreen from "@/features/bookings/screens/BookingsScreen";
import ChatScreen from "@/features/chat/screens/ChatScreen";
import ProfileScreen from "@/features/profile/screens/ProfileScreen";
import type { CustomerTabParamList, RootScreenProps } from "./types";
import { useShell } from "./useShell";

const Tab = createBottomTabNavigator<CustomerTabParamList>();

const ITEMS: Record<keyof CustomerTabParamList, TabItem> = {
	BookTab: { label: "Home", icon: HomeIcon },
	BookingsTab: { label: "Bookings", icon: BookingsIcon },
	ChatTab: { label: "Chat", icon: ChatIcon },
	ProfileTab: { label: "Profile", icon: ProfileIcon },
};

/** The customer's tab shell: shared header (logo, notifications, avatar) and the bottom tab bar. */
export default function CustomerTabs({ navigation }: RootScreenProps<"CustomerHome">) {
	const { header } = useShell(() => navigation.navigate("CustomerHome", { screen: "ProfileTab" }));
	return (
		<Tab.Navigator screenOptions={{ header }} tabBar={(props) => <TabBar {...props} items={ITEMS} />}>
			<Tab.Screen name="BookTab" component={BookServiceScreen} />
			<Tab.Screen name="BookingsTab" component={BookingsScreen} />
			<Tab.Screen name="ChatTab" component={ChatScreen} />
			{/* The profile editor has its own header (back and sign out). */}
			<Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ headerShown: false }} />
		</Tab.Navigator>
	);
}
