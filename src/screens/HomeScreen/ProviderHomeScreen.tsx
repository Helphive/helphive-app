import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import Home from "./ProviderTabs/Home/Home";
import Orders from "./ProviderTabs/Orders/Orders";
import Balance from "./ProviderTabs/Balance/Balance";
import Chat from "./ProviderTabs/Chat/Chat";
import { Image } from "react-native";
import { useAppTheme } from "../../utils/theme";

const Tab = createBottomTabNavigator();

const homeIcon = require("../../../assets/icons/provider-tabs/home.png");
const homeDisabledIcon = require("../../../assets/icons/provider-tabs/home-disabled.png");
const ticketIcon = require("../../../assets/icons/provider-tabs/ticket.png");
const ticketDisabledIcon = require("../../../assets/icons/provider-tabs/ticket-disabled.png");
const walletIcon = require("../../../assets/icons/provider-tabs/wallet.png");
const walletDisabledIcon = require("../../../assets/icons/provider-tabs/wallet-disabled.png");
const chatIcon = require("../../../assets/icons/provider-tabs/chat.png");
const chatDisabledIcon = require("../../../assets/icons/provider-tabs/chat-disabled.png");

const ProviderHomeScreen = ({ userDetails }: { userDetails: any }) => {
	const theme = useAppTheme();

	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: theme.colors.primary,
				tabBarInactiveTintColor: theme.colors.bodyColor,
				tabBarLabelStyle: {
					fontSize: 12,
					fontFamily: theme.colors.fontMedium,
					marginBottom: 10,
				},
				tabBarStyle: {
					height: 70,
					paddingVertical: 10,
					paddingHorizontal: 10,
				},
				tabBarItemStyle: {
					flexDirection: "column",
					height: "100%",
					justifyContent: "center",
					alignItems: "center",
				},
			}}
		>
			<Tab.Screen
				name="ProviderTabsHome"
				options={{
					tabBarLabel: "Home",
					tabBarIcon: ({ focused }) => (
						<Image source={focused ? homeIcon : homeDisabledIcon} className="h-7 w-7" />
					),
				}}
			>
				{() => <Home userDetails={userDetails} />}
			</Tab.Screen>
			<Tab.Screen
				name="ProviderTabsOrders"
				component={Orders}
				options={{
					tabBarLabel: "Orders",
					tabBarIcon: ({ focused }) => (
						<Image source={focused ? ticketIcon : ticketDisabledIcon} className="h-7 w-7" />
					),
				}}
			/>
			<Tab.Screen
				name="ProviderTabsBalance"
				component={Balance}
				options={{
					tabBarLabel: "Balance",
					tabBarIcon: ({ focused }) => (
						<Image source={focused ? walletIcon : walletDisabledIcon} className="h-7 w-7" />
					),
				}}
			/>
			<Tab.Screen
				name="ProviderTabsChat"
				component={Chat}
				options={{
					tabBarLabel: "Chat",
					tabBarIcon: ({ focused }) => (
						<Image source={focused ? chatIcon : chatDisabledIcon} className="h-7 w-7" />
					),
				}}
			/>
		</Tab.Navigator>
	);
};

export default ProviderHomeScreen;
