import React, { FC, useState } from "react";
import { Image, View } from "react-native";
import { Text, Button, TextInput, HelperText } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { RootStackParamList } from "../../utils/CustomTypes";
import { useAppTheme } from "../../utils/theme";
import { useProviderSignupMutation } from "../../features/auth/authApiSlice";
import CustomDialog from "../../components/CustomDialog";
import {
	validateEmail,
	validateFirstName,
	validateLastName,
	validatePassword,
} from "../../utils/validation/textValidations";

const ProviderSignupScreen: FC = () => {
	const theme = useAppTheme();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const [firstNameError, setFirstNameError] = useState<string | null>(null);
	const [lastNameError, setLastNameError] = useState<string | null>(null);
	const [emailError, setEmailError] = useState<string | null>(null);
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
	const [signupError, setSignupError] = useState<string | null>(null);
	const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

	const [providerSignup, { isLoading }] = useProviderSignupMutation();

	const Logo = require("../../../assets/Logo/logo-light.png");

	const handleFirstNameChange = (text: string) => {
		setFirstName(text);
		setFirstNameError(null);
	};

	const handleLastNameChange = (text: string) => {
		setLastName(text);
		setLastNameError(null);
	};

	const handleEmailChange = (text: string) => {
		setEmail(text);
		setEmailError(null);
	};

	const handlePasswordChange = (text: string) => {
		setPassword(text);
		setPasswordError(validatePassword(text));
	};

	const handleConfirmPasswordChange = (text: string) => {
		setConfirmPassword(text);
		setConfirmPasswordError(text != password ? "Passwords do not match" : null);
	};

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	const handleSignup = async () => {
		let errorFound = false;
		if (validateFirstName(firstName).length > 0) {
			setFirstNameError(validateFirstName(firstName));
			errorFound = true;
		}
		if (validateLastName(lastName).length > 0) {
			setLastNameError(validateLastName(lastName));
			errorFound = true;
		}
		if (validateEmail(email).length > 0) {
			setEmailError(validateEmail(email));
			errorFound = true;
		}
		if (validatePassword(password).length > 0) {
			setPasswordError(validatePassword(password));
			errorFound = true;
		}
		if (validatePassword(confirmPassword).length > 0 || password !== confirmPassword) {
			setConfirmPasswordError("Passwords do not match");
			errorFound = true;
		}
		if (errorFound) return;

		try {
			const trimmedData = {
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email: email.trim(),
				password: password,
			};
			await providerSignup(trimmedData).unwrap();
			setFirstName("");
			setLastName("");
			setEmail("");
			setPassword("");
			setConfirmPassword("");
			setFirstNameError(null);
			setLastNameError(null);
			setEmailError(null);
			setPasswordError(null);
			setConfirmPasswordError(null);
			setSignupSuccess("We've sent you an email with the verification link. Please verify your email.");
		} catch (error: any) {
			console.log("Provider Signup error:", error?.data?.message || error?.message || error);

			if (error?.status === "FETCH_ERROR") {
				setSignupError("Network error. Please check your internet connection and try again.");
			} else if (error?.status === 400) {
				setSignupError("Invalid credentials.");
			} else if (error?.status === 409) {
				setSignupError(
					error?.data?.message || "An account already exists on this email. Please use a different one.",
				);
			} else if (error?.status >= 500) {
				setSignupError("Internal server error. Please try again later.");
			} else {
				setSignupError("An unexpected error occurred. Please try again later.");
			}
		}
	};

	const hideDialog = () => setSignupError(null);
	const hideSuccessDialog = () => {
		setSignupSuccess(null);
		setFirstName("");
		setLastName("");
		setEmail("");
		setPassword("");
		setConfirmPassword("");
		setFirstNameError(null);
		setLastNameError(null);
		setEmailError(null);
		setPasswordError(null);
		setConfirmPasswordError(null);
		navigation.navigate("Login");
	};

	return (
		<SafeAreaView style={{ backgroundColor: theme.colors.background }}>
			<View className="mx-4 flex justify-center items-start h-full">
				<View className="flex flex-row items-center justify-center gap-2 mb-6">
					<Image source={Logo} className="h-12 w-12" />
				</View>
				<View>
					<Text
						variant="headlineSmall"
						style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.onBackground }}
						className="mb-1"
					>
						Create a Provider Account
					</Text>
					<Text
						variant="bodyMedium"
						style={{ fontFamily: theme.colors.fontRegular, color: theme.colors.bodyColor }}
						className="mb-6"
					>
						Sign up with your email address
					</Text>
				</View>
				<TextInput
					value={firstName}
					onChangeText={handleFirstNameChange}
					mode="outlined"
					label="First Name"
					placeholder="Enter first name..."
					className="w-full"
					placeholderTextColor={theme.colors.placeholder}
					spellCheck={false}
					error={!!firstNameError}
				/>
				{firstNameError && (
					<View className="w-full">
						<HelperText type="error">{firstNameError}</HelperText>
					</View>
				)}
				<TextInput
					value={lastName}
					onChangeText={handleLastNameChange}
					mode="outlined"
					label="Last Name"
					placeholder="Enter last name..."
					className="w-full"
					placeholderTextColor={theme.colors.placeholder}
					spellCheck={false}
					error={!!lastNameError}
				/>
				{lastNameError && (
					<View className="w-full">
						<HelperText type="error">{lastNameError}</HelperText>
					</View>
				)}
				<TextInput
					value={email}
					onChangeText={handleEmailChange}
					mode="outlined"
					label="Email"
					placeholder="Enter email..."
					autoCapitalize="none"
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
				<TextInput
					value={password}
					onChangeText={handlePasswordChange}
					mode="outlined"
					label="Password"
					secureTextEntry={!showPassword}
					placeholder="Enter password..."
					autoCapitalize="none"
					right={
						<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={togglePasswordVisibility} />
					}
					className="w-full"
					placeholderTextColor={theme.colors.placeholder}
					spellCheck={false}
					error={!!passwordError}
				/>
				{passwordError && (
					<View className="w-full">
						<HelperText type="error">{passwordError}</HelperText>
					</View>
				)}
				<TextInput
					value={confirmPassword}
					onChangeText={handleConfirmPasswordChange}
					mode="outlined"
					label="Confirm Password"
					secureTextEntry={!showPassword}
					placeholder="Confirm password..."
					autoCapitalize="none"
					right={
						<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={togglePasswordVisibility} />
					}
					className="w-full"
					placeholderTextColor={theme.colors.placeholder}
					spellCheck={false}
					error={!!confirmPasswordError}
				/>
				{confirmPasswordError && (
					<View className="w-full">
						<HelperText type="error">{confirmPasswordError}</HelperText>
					</View>
				)}
				<Button
					onPress={handleSignup}
					mode="contained"
					className="w-full mt-5"
					theme={{ roundness: 2 }}
					loading={isLoading}
					disabled={isLoading}
				>
					<Text
						style={{
							color: !isLoading ? theme.colors.buttonText : theme.colors.onSurfaceDisabled,
							fontFamily: theme.colors.fontBold,
							padding: 5,
						}}
					>
						{!isLoading ? "Request a provider account" : "Loading..."}
					</Text>
				</Button>
				<View className="w-full flex justify-center items-center">
					<Text className="mt-2">
						Already have an account?{" "}
						<Text
							style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.primary }}
							onPress={() => {
								setFirstName("");
								setLastName("");
								setEmail("");
								setPassword("");
								setConfirmPassword("");
								setFirstNameError(null);
								setLastNameError(null);
								setEmailError(null);
								setPasswordError(null);
								setConfirmPasswordError(null);
								navigation.navigate("Login");
							}}
						>
							Log in
						</Text>
					</Text>
					<View className="mt-12">
						<Button
							className="w-full"
							mode="outlined"
							style={{ borderColor: theme.colors.primary }}
							theme={{ roundness: 2 }}
							onPress={() => {
								setFirstName("");
								setLastName("");
								setEmail("");
								setPassword("");
								setConfirmPassword("");
								setFirstNameError(null);
								setLastNameError(null);
								setEmailError(null);
								setPasswordError(null);
								setConfirmPasswordError(null);
								navigation.navigate("Signup");
							}}
						>
							<Text variant="bodySmall" style={{ fontFamily: theme.colors.fontSemiBold }}>
								Register as a User
							</Text>
						</Button>
					</View>
				</View>
			</View>
			<CustomDialog
				title="Error"
				message={signupError}
				buttonText="Try Again"
				icon="alert-circle-outline"
				iconColor={theme.colors.warning}
				hideDialog={hideDialog}
			/>
			<CustomDialog
				title="You're all set!"
				message={signupSuccess}
				buttonText="Login"
				icon="check-circle-outline"
				iconColor={theme.colors.success}
				hideDialog={hideSuccessDialog}
			/>
		</SafeAreaView>
	);
};

export default ProviderSignupScreen;
