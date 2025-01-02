export const handleNotificationScreen = (notification: any, navigationRef: any) => {
	const screen = notification?.notification?.additionalData?.screen;
	if (navigationRef.current) {
		if (screen === "BookingDetails") {
			const bookingId = notification?.notification?.additionalData?.bookingId;
			navigationRef.current.navigate("BookingDetails", { bookingId });
		} else if (screen === "MyOrderDetails") {
			const bookingId = notification?.notification?.additionalData?.bookingId;
			navigationRef.current.navigate("MyOrderDetails", { bookingId });
		} else if (screen === "AcceptOrder") {
			const bookingId = notification?.notification?.additionalData?.bookingId;
			navigationRef.current.navigate("AcceptOrder", { bookingId });
		} else if (screen === "Earnings") {
			navigationRef.current.navigate("Earnings");
		}
	}
};
