import React, { FC, useState } from "react";
import { Image, View } from "react-native";
import { Text, Button, TextInput, HelperText } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";

import { RootStackParamList } from "../../utils/CustomTypes";
import { useAppTheme } from "../../utils/theme";
import { setCredentials } from "../../features/auth/authSlice";
import { useLoginMutation } from "../../features/auth/authApiSlice";
import { useGetEmailVerificationMutation } from "../../features/email/emailApiSlice";
import { storeRefreshToken } from "../../app/securestore/secureStoreUtility";
import CustomDialog from "../../components/CustomDialog";
import { validateEmail } from "../../utils/validation/textValidations";
import { OneSignal } from "react-native-onesignal";
import { generateUUID } from "../../utils/uuid";
import { CometChatUIKit } from "@cometchat/chat-uikit-react-native";

const LoginScreen: FC = () => {
	const theme = useAppTheme();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

	const [email, setEmail] = useState("royalthunder1122+user1@gmail.com");
	const [password, setPassword] = useState("Thunder.royal@1");
	const [showPassword, setShowPassword] = useState(false);

	const [emailError, setEmailError] = useState<string | null>(null);
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const [loginError, setLoginError] = useState<string | null>(null);
	const [emailVerificationError, setEmailVerificationError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const dispatch = useDispatch();
	const [login] = useLoginMutation();
	const [getEmailVerification] = useGetEmailVerificationMutation();

	const Logo = require("../../../assets/Logo/logo-light.png");

	const handleEmailChange = (text: string) => {
		setEmail(text);
		setEmailError(null);
		setLoginError(null);
	};

	const handlePasswordChange = (text: string) => {
		setPassword(text);
		setPasswordError(null);
		setLoginError(null);
	};

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	const handleLogin = async () => {
		const emailError = validateEmail(email);
		const passwordError = !password ? "Password is required" : "";

		if (emailError || passwordError) {
			setEmailError(emailError || null);
			setPasswordError(passwordError || null);
			return;
		}

		setEmailError(null);
		setPasswordError(null);
		setLoginError(null);
		setIsLoading(true);

		try {
			const trimmedData = {
				email: email.trim(),
				password: password,
			};
			const userData = await login(trimmedData).unwrap();

			dispatch(
				setCredentials({
					user: userData?.user,
					accessToken: userData?.accessToken,
					refreshToken: userData?.refreshToken,
				}),
			);
			await storeRefreshToken(userData?.refreshToken);

			if (userData?.user?._id) {
				// Use the custom UUID generator
				const randomId = generateUUID();

				OneSignal.User.addAlias("external_id", userData.user._id.toString() + randomId);
				OneSignal.User.getExternalId().then((id) => {
					console.log("External ID: ", id);
				});
				OneSignal.User.addAlias("external_id", userData.user._id.toString());
				OneSignal.User.getExternalId().then((id) => {
					console.log("External ID: ", id);
				});
				OneSignal.User.getOnesignalId().then((id) => {
					console.log("OneSignal ID: ", id);
				});

				CometChatUIKit.login({ uid: userData.user._id.toString() })
					.then((user) => {
						console.log(`User logged in successfully  ${user}`);
					})
					.catch((error) => {
						console.log("Login failed with exception:", error);
					});
			}

			setEmail("");
			setPassword("");
			setEmailError(null);
			setPasswordError(null);

			navigation.replace("Home");
		} catch (error: any) {
			console.log("Login error:", error?.data?.message || error?.message || error);

			if (error?.status === "FETCH_ERROR") {
				setLoginError("Network error. Please check your internet connection and try again.");
			} else if (error?.status === 400) {
				setLoginError("Invalid email or password.");
			} else if (error?.status === 401) {
				setLoginError("Authentication failed. Email or password was not correct.");
			} else if (error?.status === 403) {
				setEmailVerificationError(
					"We already sent you an email with the verification link. Please verify your email before logging in.",
				);
			} else if (error?.status >= 500) {
				setLoginError("Internal server error. Please try again later.");
			} else {
				setLoginError("An unexpected error occurred. Please try again later.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	const hideDialog = () => setLoginError(null);
	const resendVerificationEmail = async () => {
		try {
			setIsLoading(true);
			const credentials = { email: email.trim() };
			await getEmailVerification(credentials).unwrap();
			setEmailVerificationError(null);
		} catch (err) {
			console.error("Failed to verify email:", err);
		} finally {
			setIsLoading(false);
		}
	};

	const hideEmailDialog = () => setEmailVerificationError(null);

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
						Log in
					</Text>
					<Text
						variant="bodyMedium"
						style={{ fontFamily: theme.colors.fontRegular, color: theme.colors.bodyColor }}
						className="mb-6"
					>
						Welcome back! Please enter your details
					</Text>
				</View>
				<TextInput
					value={email}
					onChangeText={handleEmailChange}
					mode="outlined"
					label="Email"
					textContentType="emailAddress"
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
					textContentType="password"
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
				<View className="w-full">
					<Text
						style={{
							fontFamily: theme.colors.fontSemiBold,
							color: theme.colors.primary,
							marginLeft: 5,
							marginTop: 8,
							textDecorationLine: "underline",
						}}
						onPress={() => {
							setEmail("");
							setPassword("");
							setEmailError(null);
							setPasswordError(null);
							navigation.navigate("ForgotPassword");
						}}
					>
						Forgot Password?
					</Text>
				</View>
				<Button
					onPress={handleLogin}
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
						{!isLoading ? "Login" : "Logging in..."}
					</Text>
				</Button>
				<View className="w-full flex justify-center items-center">
					<Text className="mt-2">
						New to Helphive?{" "}
						<Text
							style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.primary }}
							onPress={() => {
								setEmail("");
								setPassword("");
								setEmailError(null);
								setPasswordError(null);
								navigation.navigate("Signup");
							}}
						>
							Register
						</Text>
					</Text>
					<View className="mt-12">
						<Button
							className="w-full"
							mode="outlined"
							style={{ borderColor: theme.colors.primary }}
							theme={{ roundness: 2 }}
							onPress={() => {
								setEmail("");
								setPassword("");
								setEmailError(null);
								setPasswordError(null);
								navigation.navigate("ProviderSignup");
							}}
						>
							<Text variant="bodySmall" style={{ fontFamily: theme.colors.fontSemiBold }}>
								Become a Helphive Provider
							</Text>
						</Button>
					</View>
				</View>
			</View>
			<CustomDialog
				title="Error"
				message={loginError}
				buttonText="Try Again"
				icon="alert-circle-outline"
				iconColor={theme.colors.warning}
				hideDialog={hideDialog}
			/>
			<CustomDialog
				title="Email not verified"
				message={emailVerificationError}
				buttonText="Resend email"
				icon="alert-circle-outline"
				iconColor={theme.colors.warning}
				buttonAction={resendVerificationEmail}
				buttonLoading={isLoading}
				hideDialog={hideEmailDialog}
			/>
		</SafeAreaView>
	);
};

export default LoginScreen;
