import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Image } from "react-native";

import Home from "./UserTabs/Home/Home";
import Bookings from "./UserTabs/Bookings/Bookings";
import Profile from "./UserTabs/Profile/Profile";
import Chat from "./UserTabs/Chat/Chat";
import { useAppTheme } from "../../utils/theme";

const Tab = createBottomTabNavigator();

const homeIcon = require("../../../assets/icons/user-tabs/home.png");
const homeDisabledIcon = require("../../../assets/icons/user-tabs/home-disabled.png");
const ticketIcon = require("../../../assets/icons/user-tabs/ticket.png");
const ticketDisabledIcon = require("../../../assets/icons/user-tabs/ticket-disabled.png");
const chatIcon = require("../../../assets/icons/user-tabs/chat.png");
const chatDisabledIcon = require("../../../assets/icons/user-tabs/chat-disabled.png");
const profileIcon = require("../../../assets/icons/user-tabs/profile.png");
const profileDisabledIcon = require("../../../assets/icons/user-tabs/profile-disabled.png");

interface Props {
	userDetails: any;
}

const UserHomeScreen = ({ userDetails }: Props) => {
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
				name="UserTabsHome"
				component={Home}
				options={{
					tabBarLabel: "Home",
					tabBarIcon: ({ focused }) => (
						<Image source={focused ? homeIcon : homeDisabledIcon} className="h-7 w-7" />
					),
				}}
			/>
			<Tab.Screen
				name="UserTabsBookings"
				component={Bookings}
				options={{
					tabBarLabel: "Bookings",
					tabBarIcon: ({ focused }) => (
						<Image source={focused ? ticketIcon : ticketDisabledIcon} className="h-7 w-7" />
					),
				}}
			/>
			<Tab.Screen
				name="UserTabsChat"
				component={Chat}
				options={{
					tabBarLabel: "Chat",
					tabBarIcon: ({ focused }) => (
						<Image source={focused ? chatIcon : chatDisabledIcon} className="h-7 w-7" />
					),
				}}
			/>
			<Tab.Screen
				name="UserTabsProfile"
				options={{
					tabBarLabel: "Profile",
					tabBarIcon: ({ focused }) => (
						<Image source={focused ? profileIcon : profileDisabledIcon} className="h-7 w-7" />
					),
				}}
			>
				{() => <Profile userDetails={userDetails} />}
			</Tab.Screen>
		</Tab.Navigator>
	);
};

export default UserHomeScreen;
