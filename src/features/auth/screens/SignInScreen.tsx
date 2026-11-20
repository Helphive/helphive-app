import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Button, ConfirmDialog, Divider, LinkButton, Notice, PasswordField, TextField, space } from "@/ui";
import { validateEmail } from "@/lib/validation";
import { getErrorMessage } from "@/services/api/errors";
import { useGetEmailVerificationMutation } from "../api";
import { useSignIn, type SignInResult } from "../useAuthActions";
import { AuthLayout, AuthLinkLine, FormStack } from "../components/AuthLayout";
import { DemoAccounts } from "../components/DemoAccounts";
import type { DemoAccount } from "../demoAccounts";

const FAILURE_COPY: Record<Exclude<SignInResult, { ok: true }>["reason"], string> = {
	unverified: "",
	invalid: "The email or password is not right. Check them and try again.",
	network: "No connection. Check your internet and try again.",
	server: "HelpHive is not responding. Try again in a moment.",
	unknown: "Something went wrong. Check your connection and try again.",
};

export default function SignInScreen() {
	const navigation = useNavigation();
	const { signIn, isLoading } = useSignIn();
	const [resend, resendState] = useGetEmailVerificationMutation();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
	const [resent, setResent] = useState(false);
	const [demo, setDemo] = useState<DemoAccount["key"] | null>(null);
	const [submitted, setSubmitted] = useState(false);

	const validate = (nextEmail = email, nextPassword = password) => {
		const next = {
			email: validateEmail(nextEmail) || undefined,
			password: nextPassword ? undefined : "Enter your password",
		};
		setErrors(next);
		return !next.email && !next.password;
	};

	const run = async (loginEmail: string, loginPassword: string) => {
		setFormError(null);
		const result = await signIn(loginEmail, loginPassword);
		if (result.ok) {
			navigation.reset({ index: 0, routes: [{ name: "Home" }] });
			return;
		}
		if (result.reason === "unverified") {
			setResent(false);
			setUnverifiedEmail(loginEmail.trim());
		} else setFormError(FAILURE_COPY[result.reason]);
	};

	const onSubmit = async () => {
		setSubmitted(true);
		if (!validate()) return;
		await run(email, password);
	};

	const onDemo = async (account: DemoAccount) => {
		setDemo(account.key);
		setErrors({});
		await run(account.email, account.password);
		setDemo(null);
	};

	const onResend = async () => {
		if (!unverifiedEmail) return;
		try {
			await resend({ email: unverifiedEmail }).unwrap();
			setResent(true);
		} catch (error) {
			setUnverifiedEmail(null);
			setFormError(getErrorMessage(error, "The verification email could not be sent. Try again in a moment."));
		}
	};

	const go = (route: "Signup" | "ProviderSignup" | "ForgotPassword") => {
		setErrors({});
		setFormError(null);
		setSubmitted(false);
		navigation.navigate(route, undefined, { pop: true });
	};

	const busy = isLoading || demo !== null;

	return (
		<AuthLayout title="Sign in" subtitle="Welcome back. Sign in to continue to HelpHive.">
			<FormStack>
				{formError ? <Notice tone="error">{formError}</Notice> : null}
				<TextField
					label="Email"
					required
					value={email}
					onChangeText={(text) => {
						setEmail(text);
						if (submitted) validate(text, password);
					}}
					error={errors.email}
					keyboardType="email-address"
					autoCapitalize="none"
					autoCorrect={false}
					autoComplete="email"
					textContentType="emailAddress"
					returnKeyType="next"
				/>
				<View>
					<PasswordField
						label="Password"
						required
						value={password}
						onChangeText={(text) => {
							setPassword(text);
							if (submitted) validate(email, text);
						}}
						error={errors.password}
						returnKeyType="go"
						onSubmitEditing={onSubmit}
					/>
					<View style={styles.forgot}>
						<LinkButton onPress={() => go("ForgotPassword")}>Forgot password?</LinkButton>
					</View>
				</View>
				<Button onPress={onSubmit} loading={isLoading && demo === null} disabled={busy} fullWidth>
					{isLoading && demo === null ? "Signing in" : "Sign in"}
				</Button>
			</FormStack>

			<Divider />
			<DemoAccounts context="signin" busy={demo} disabled={busy} onPick={onDemo} />

			<View style={styles.links}>
				<AuthLinkLine text="Don't have an account?" link="Create an account" onPress={() => go("Signup")} />
				<AuthLinkLine
					text="Want to work shifts?"
					link="Register as a provider"
					onPress={() => go("ProviderSignup")}
				/>
			</View>

			<ConfirmDialog
				visible={!!unverifiedEmail}
				title={resent ? "Verification email sent" : "Verify your email first"}
				description={
					resent
						? `We sent a new link to ${unverifiedEmail}. Open it, then sign in.`
						: `Open the verification link we emailed to ${unverifiedEmail}, then sign in. No email? We can send it again.`
				}
				confirmLabel={resent ? "Done" : "Resend email"}
				cancelLabel="Close"
				loading={resendState.isLoading}
				onConfirm={resent ? () => setUnverifiedEmail(null) : onResend}
				onClose={() => setUnverifiedEmail(null)}
			/>
		</AuthLayout>
	);
}

const styles = StyleSheet.create({
	forgot: { alignItems: "flex-end", marginTop: space[1], marginBottom: -space[3] },
	links: { gap: space[3], paddingTop: space[2] },
});
