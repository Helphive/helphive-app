import React, { useState } from "react";
import { Image, View, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../../../../utils/theme";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";

const vector1 = require("../../../../../assets/cloud vectors/vector-1.png");
const vector2 = require("../../../../../assets/cloud vectors/vector-2.png");
const logo = require("../../../../../assets/Logo/logo-light.png");

import CustomDialog from "../../../../components/CustomDialog";
import CustomSnackbar from "../../../../components/CustomSnackbar";

import Step1Content from "./components/step1";
import Step2Content from "./components/step2";

import services from "../../../../utils/services";

import { useDispatch } from "react-redux";
import {
	setBookingInfo,
	setBookingId,
	setClientSecret,
	setPaymentIntentId,
	setPaymentStatus,
} from "../../../../features/booking/bookingSlice";
import { useCreateBookingMutation } from "../../../../features/user/userApiSlice";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../../utils/CustomTypes";

const Home = () => {
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

	const theme = useAppTheme();
	const [currentStep, setCurrentStep] = useState(1);
	const [selectedService, setSelectedService] = useState<number | null>(null);
	const [rate, setRate] = useState<string>("20");
	const [snackbarVisible, setSnackbarVisible] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState("");
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [startTime, setStartTime] = useState<Date | null>(null);
	const [hours, setHours] = useState<number>(1);
	const [address, setAddress] = useState<string>("");
	const [latitude, setLatitude] = useState<number | null>(null);
	const [longitude, setLongitude] = useState<number | null>(null);
	const [dateError, setDateError] = useState<string | null>(null);
	const [addressError, setAddressError] = useState<string | null>(null);
	const [createBookingSuccess, setCreateBookingSuccess] = useState<string | null>(null);
	const [createBookingError, setCreateBookingError] = useState<string | null>(null);

	const dispatch = useDispatch();

	const isRateValid = (rate: string) => {
		const rateNumber = parseFloat(rate);
		return !isNaN(rateNumber) && rateNumber >= 20 && rateNumber <= 200 && rateNumber % 1 === 0;
	};

	const handleNext = () => {
		if (currentStep < 2 && selectedService !== null && isRateValid(rate)) {
			setCurrentStep(currentStep + 1);
		} else {
			setSnackbarMessage("Please select a service and ensure the rate is between $20 and $200.");
			setSnackbarVisible(true);
		}
	};

	const handlePrevious = () => {
		if (currentStep > 1) setCurrentStep(currentStep - 1);
	};

	const [createBooking, { isLoading }] = useCreateBookingMutation();

	const handleBooking = async () => {
		const bookingInfo = {
			service: selectedService,
			rate: Number(rate),
			hours: Number(hours),
			startDate: startDate,
			startTime: startTime,
			address: address.trim(),
			latitude,
			longitude,
		};

		console.log(latitude, longitude);
		try {
			const { bookingId, paymentIntentId, clientSecret } = await createBooking(bookingInfo).unwrap();

			dispatch(
				setBookingInfo({
					...bookingInfo,
					service: {
						id: selectedService,
						name: services.find((service) => service.id === selectedService)?.name,
					},
					startDate: startDate?.toISOString(),
					startTime: startTime?.toISOString(),
				}),
			);
			dispatch(setBookingId(bookingId));
			dispatch(setPaymentIntentId(paymentIntentId));
			dispatch(setClientSecret(clientSecret));
			dispatch(setPaymentStatus("pending"));

			setCreateBookingSuccess(
				"Booking successfully created. Go to Payment screen to make the booking available for service providers to accept.",
			);
		} catch (error: any) {
			console.log("Error while creating a booking:", error?.data?.message || error?.message || error);

			if (error?.status === "FETCH_ERROR") {
				setCreateBookingError("Network error. Please check your internet connection and try again.");
			} else if (error?.status === 400) {
				setStartDate(null);
				setStartTime(null);
				setCreateBookingError(
					error?.data?.message || "The selected start date & time passed. Please try again.",
				);
			} else {
				setCreateBookingError("An unexpected error occurred. Please try again later.");
			}
		}
	};

	const hideDialog = () => setCreateBookingError(null);
	const hideSuccessDialog = () => {
		setCurrentStep(1);
		setSelectedService(null);
		setRate("20");
		setStartDate(null);
		setStartTime(null);
		setHours(1);
		setAddress("");
		setLatitude(null);
		setLongitude(null);
		setCreateBookingSuccess(null);
		navigation.navigate("UserHome", { screen: "UserTabsBookings", animated: false });
		navigation.navigate("BookingPayment");
	};

	return (
		<SafeAreaView className="h-full w-full" style={{ backgroundColor: theme.colors.primary }}>
			<StatusBar backgroundColor={theme.colors.primary} />
			<View className="flex-1">
				<View className="relative">
					<View className="flex flex-row justify-between items-center px-4 pt-6 pb-4">
						<View className="flex flex-row justify-start items-center gap-2">
							<Image source={logo} className="h-8 w-8" />
							<Text
								variant="titleLarge"
								style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.onPrimary }}
								className="text-center"
							>
								Helphive
							</Text>
						</View>
					</View>
					<Image source={vector1} className="w-full absolute top-[-40px] left-[0px] -z-10" />
					<Image source={vector2} className="w-full h-[250px] absolute top-[20px] right-0 -z-10" />
				</View>
				<View className="flex-1 px-4" style={{ backgroundColor: theme.colors.background }}>
					<View className="flex flex-row justify-around items-center my-4">
						<TouchableOpacity onPress={() => setCurrentStep(1)} className="flex items-center mx-2">
							<View
								style={{
									backgroundColor:
										currentStep === 1 ? theme.colors.primary : theme.colors.surfaceDisabled,
								}}
								className="rounded-full w-10 h-10 flex items-center justify-center mb-1"
							>
								{currentStep > 1 ? (
									<MaterialIcons name="check" size={24} color={theme.colors.primary} />
								) : (
									<Text
										style={{
											color:
												currentStep === 1
													? theme.colors.onPrimary
													: theme.colors.onSurfaceDisabled,
											fontFamily: theme.colors.fontBold,
										}}
									>
										01
									</Text>
								)}
							</View>
							<Text
								style={{
									color:
										currentStep === 1 ? theme.colors.onBackground : theme.colors.onSurfaceDisabled,
									fontFamily: theme.colors.fontSemiBold,
								}}
							>
								Step 1
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => {
								if (selectedService !== null && isRateValid(rate)) {
									setCurrentStep(2);
								} else {
									setSnackbarMessage("Please enter valid details.");
									setSnackbarVisible(true);
								}
							}}
							className="flex items-center mx-2"
						>
							<View
								style={{
									backgroundColor:
										currentStep === 2 ? theme.colors.primary : theme.colors.surfaceDisabled,
								}}
								className="rounded-full w-10 h-10 flex items-center justify-center mb-1"
							>
								<Text
									style={{
										color:
											currentStep === 2 ? theme.colors.onPrimary : theme.colors.onSurfaceDisabled,
										fontFamily: theme.colors.fontBold,
									}}
								>
									02
								</Text>
							</View>
							<Text
								style={{
									color:
										currentStep === 2 ? theme.colors.onBackground : theme.colors.onSurfaceDisabled,
									fontFamily: theme.colors.fontSemiBold,
								}}
							>
								Step 2
							</Text>
						</TouchableOpacity>
					</View>
					<View className="flex-1">
						{currentStep === 1 && (
							<Step1Content
								onNext={handleNext}
								services={services}
								selectedService={selectedService}
								setSelectedService={setSelectedService}
								rate={rate}
								setRate={setRate}
								disableNext={selectedService === null || !isRateValid(rate)}
							/>
						)}
						{currentStep === 2 && (
							<Step2Content
								onPrevious={handlePrevious}
								setSnackbarVisible={setSnackbarVisible}
								setSnackbarMessage={setSnackbarMessage}
								startDate={startDate}
								setStartDate={setStartDate}
								startTime={startTime}
								setStartTime={setStartTime}
								selectedService={selectedService}
								rate={rate}
								hours={hours}
								setHours={setHours}
								address={address}
								setAddress={setAddress}
								latitude={latitude}
								setLatitude={setLatitude}
								longitude={longitude}
								setLongitude={setLongitude}
								dateError={dateError}
								setDateError={setDateError}
								addressError={addressError}
								setAddressError={setAddressError}
								handleBooking={handleBooking}
								isBookingLoading={isLoading}
							/>
						)}
					</View>
				</View>
			</View>
			<CustomSnackbar
				visible={snackbarVisible}
				onDismiss={() => setSnackbarVisible(false)}
				duration={3000}
				action={{
					label: "OK",
					onPress: () => setSnackbarVisible(false),
				}}
			>
				{snackbarMessage}
			</CustomSnackbar>
			<CustomDialog
				title="Error"
				message={createBookingError}
				buttonText="Uh oh!"
				icon="alert-circle-outline"
				iconColor={theme.colors.warning}
				hideDialog={hideDialog}
			/>
			<CustomDialog
				title="Payment awaits!"
				message={createBookingSuccess}
				buttonText="Let's Pay"
				icon="check-circle-outline"
				iconColor={theme.colors.success}
				hideDialog={hideSuccessDialog}
				buttonAction={hideSuccessDialog}
			/>
		</SafeAreaView>
	);
};

export default Home;
