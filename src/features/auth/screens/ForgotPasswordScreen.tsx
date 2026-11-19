import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Button, EmptyState, LinkButton, Notice, TextField, space } from "@/ui";
import { BackIcon, EmailIcon } from "@/ui/icons";
import { color } from "@/ui/tokens";
import { validateEmail } from "@/lib/validation";
import { getErrorMessage, getErrorStatus } from "@/services/api/errors";
import { useGetResetPasswordMutation } from "../api";
import { AuthLayout, FormStack } from "../components/AuthLayout";

export default function ForgotPasswordScreen() {
	const navigation = useNavigation();
	const [requestReset, { isLoading }] = useGetResetPasswordMutation();
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | undefined>();
	const [submitted, setSubmitted] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [sentTo, setSentTo] = useState<string | null>(null);

	const back = (
		<View style={styles.back}>
			<BackIcon size={16} weight="bold" color={color.coral600} />
			<LinkButton onPress={() => navigation.navigate("Login")}>Back to sign in</LinkButton>
		</View>
	);

	const onSubmit = async () => {
		setSubmitted(true);
		setFormError(null);
		const message = validateEmail(email);
		setError(message || undefined);
		if (message) return;
		try {
			await requestReset({ email: email.trim() }).unwrap();
			setSentTo(email.trim());
		} catch (err) {
			setFormError(
				getErrorStatus(err) === 404
					? "We could not find an account with that email. Check the address, or create an account."
					: getErrorMessage(err, "Something went wrong. Check your connection and try again."),
			);
		}
	};

	if (sentTo) {
		return (
			<AuthLayout
				title="Check your email"
				subtitle={`We sent a password reset link to ${sentTo}. Open the link in that email to choose a new password.`}
			>
				<EmptyState
					bare
					icon={EmailIcon}
					title="The link opens in your browser"
					description="Choose a new password there, then come back and sign in."
				/>
				<Button onPress={() => navigation.navigate("Login")} fullWidth>
					Back to sign in
				</Button>
				<Button variant="text" onPress={() => setSentTo(null)}>
					Use a different email
				</Button>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout
			top={back}
			title="Reset your password"
			subtitle="Enter your email and we will send you a link to choose a new password."
		>
			<FormStack>
				{formError ? <Notice tone="error">{formError}</Notice> : null}
				<TextField
					label="Email"
					required
					value={email}
					onChangeText={(text) => {
						setEmail(text);
						if (submitted) setError(validateEmail(text) || undefined);
					}}
					error={error}
					keyboardType="email-address"
					autoCapitalize="none"
					autoCorrect={false}
					autoComplete="email"
					returnKeyType="send"
					onSubmitEditing={onSubmit}
				/>
				<Button onPress={onSubmit} loading={isLoading} fullWidth>
					{isLoading ? "Sending link" : "Send reset link"}
				</Button>
			</FormStack>
		</AuthLayout>
	);
}

const styles = StyleSheet.create({
	back: { flexDirection: "row", alignItems: "center", gap: space[1] },
});
