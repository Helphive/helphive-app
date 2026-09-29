import React from "react";
import withAuthCheck from "../../../../../hocs/withAuthCheck";
import NotificationsScreen from "../../../../notifications/NotificationsScreen";

const ProviderNotificationsScreen = () => <NotificationsScreen role="provider" />;

export default withAuthCheck(ProviderNotificationsScreen);
