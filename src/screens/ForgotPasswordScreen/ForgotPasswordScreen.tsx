import { FC, useState } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { Text, Button, TextInput, HelperText, Icon } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";

import { RootStackParamList } from "../../utils/CustomTypes";
import { useAppTheme } from "../../utils/theme";
import { validateEmail } from "../../utils/validation/textValidations";
import { useGetResetPasswordMutation } from "../../features/email/emailApiSlice";
import CustomDialog from "../../components/CustomDialog";

const ForgotPasswordScreen: FC = () => {
	const theme = useAppTheme();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

	const [email, setEmail] = useState("");

	const [emailError, setEmailError] = useState<string | null>(null);
	const [resetPasswordSuccess, setResetPasswordSuccess] = useState<string | null>(null);
	const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);

	const [getResetPassword, { isLoading }] = useGetResetPasswordMutation();

	const Logo = require("../../../assets/Logo/logo-light.png");

	const handleEmailChange = (text: string) => {
		setEmail(text);
		setEmailError(null);
		setResetPasswordError(null);
	};

	const handleForgotPassword = async () => {
		const emailError = validateEmail(email);
		if (emailError) {
			setEmailError(emailError);
			return;
		}

		setEmailError(null);
		setResetPasswordError(null);

		try {
			const credentials = { email: email.trim() };
			await getResetPassword(credentials).unwrap();
			setResetPasswordSuccess("An email has been sent. Reset your password through the link provided.");
			setResetPasswordError(null);
			setEmail("");
		} catch (error: any) {
			console.log("Forgot password error:", error?.data?.message || error?.message || error);

			if (error?.error?.includes("Network request failed")) {
				setResetPasswordError("Network error. Please check your internet connection and try again.");
			} else if (error?.status === 400) {
				setResetPasswordError("Invalid email.");
			} else if (error?.status === 404) {
				setResetPasswordError("No associated user found with the provided email address.");
			} else if (error?.status >= 500) {
				setResetPasswordError("Internal server error. Please try again later.");
			} else {
				setResetPasswordError("An unexpected error occurred. Please try again later.");
			}
		}
	};

	const hideResetPasswordSuccessDialog = () => setResetPasswordSuccess(null);
	const hideResetPasswordErrorDialog = () => setResetPasswordError(null);

	return (
		<SafeAreaView style={{ backgroundColor: theme.colors.background }}>
			<View className="mx-4 flex justify-center items-center h-full">
				<TouchableOpacity
					className="flex flex-row items-center justify-start mb-2 w-full absolute top-5"
					onPress={() => navigation.navigate("Login")}
				>
					<Icon source="chevron-left" size={24} />
					<Image source={Logo} className="h-6 w-6 mr-2" />
					<Text variant="titleMedium" style={{ fontFamily: theme.colors.fontBold }}>
						Helphive
					</Text>
				</TouchableOpacity>
				<View className="w-full">
					<Text
						variant="headlineMedium"
						style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.onBackground }}
						className=""
					>
						Can't remember your password?
					</Text>
					<Text
						variant="titleMedium"
						style={{ fontFamily: theme.colors.fontRegular, color: theme.colors.onBackground }}
						className="mb-4"
					>
						Don't worry! We've got your back. We'll send you an email to reset it.
					</Text>
				</View>
				<TextInput
					value={email}
					onChangeText={handleEmailChange}
					mode="outlined"
					label="Email"
					autoCapitalize="none"
					placeholder="Enter email..."
					right={<TextInput.Icon icon="email" />}
					className="w-full"
					placeholderTextColor={theme.colors.placeholder}
					spellCheck={false}
					error={!!emailError}
				/>
				{emailError && (
					<View className="w-full">
						<HelperText type="error">{emailError}</HelperText>
					</View>
				)}
				<Button
					onPress={handleForgotPassword}
					mode="contained"
					className="w-full mt-3"
					theme={{ roundness: 2 }}
					loading={isLoading}
					disabled={isLoading}
					key={isLoading ? "loading" : "loaded"}
				>
					<Text
						style={{
							color: !isLoading ? theme.colors.buttonText : theme.colors.onSurfaceDisabled,
							fontFamily: theme.colors.fontBold,
							padding: 5,
						}}
					>
						{!isLoading ? "Reset Password" : "Logging in"}
					</Text>
				</Button>
			</View>
			<CustomDialog
				title="Check your inbox"
				message={resetPasswordSuccess}
				buttonText="Close"
				icon="check-circle-outline"
				iconColor={theme.colors.success}
				hideDialog={hideResetPasswordSuccessDialog}
			/>
			<CustomDialog
				title="Error"
				message={resetPasswordError}
				buttonText="Try Again"
				icon="alert-circle-outline"
				iconColor={theme.colors.warning}
				hideDialog={hideResetPasswordErrorDialog}
			/>
		</SafeAreaView>
	);
};

export default ForgotPasswordScreen;
