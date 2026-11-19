import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Button, Divider, EmptyState, Notice, PasswordField, TextField, space } from "@/ui";
import { EmailIcon } from "@/ui/icons";
import { PASSWORD_HINT, validateEmail, validateFirstName, validateLastName, validatePassword } from "@/lib/validation";
import { getErrorMessage, getErrorStatus } from "@/services/api/errors";
import { useProviderSignupMutation, useSignupMutation } from "../api";
import { useSignIn } from "../useAuthActions";
import { AuthLayout, AuthLinkLine, FormStack } from "../components/AuthLayout";
import { DemoAccounts } from "../components/DemoAccounts";
import type { DemoAccount } from "../demoAccounts";

type Fields = { firstName: string; lastName: string; email: string; password: string; confirmPassword: string };
type FieldErrors = Partial<Record<keyof Fields, string>>;

const COPY = {
	user: {
		title: "Create your account",
		subtitle: "Sign up to book hospitality services.",
		submit: "Create account",
		success: "Verify your email address, then sign in to continue.",
		switchText: "Want to work shifts instead?",
		switchLink: "Sign up as a provider",
		switchTo: "ProviderSignup",
	},
	provider: {
		title: "Become a provider",
		subtitle: "Join HelpHive and start earning.",
		submit: "Create provider account",
		success: "After you verify it, sign in to complete provider onboarding.",
		switchText: "Want to book services instead?",
		switchLink: "Sign up as a customer",
		switchTo: "Signup",
	},
} as const;

const EMPTY: Fields = { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" };

const validate = (f: Fields): FieldErrors => {
	const errors: FieldErrors = {
		firstName: validateFirstName(f.firstName),
		lastName: validateLastName(f.lastName),
		email: validateEmail(f.email),
		password: validatePassword(f.password),
		confirmPassword: !f.confirmPassword
			? "Enter the password again"
			: f.confirmPassword !== f.password
				? "The passwords do not match"
				: "",
	};
	for (const key of Object.keys(errors) as (keyof Fields)[]) if (!errors[key]) delete errors[key];
	return errors;
};

/** Customer sign-up (`role="user"`) and provider sign-up (`role="provider"`): one form, two endpoints. */
export default function SignUpScreen({ role }: { role: "user" | "provider" }) {
	const copy = COPY[role];
	const navigation = useNavigation();
	const [signupUser, userState] = useSignupMutation();
	const [signupProvider, providerState] = useProviderSignupMutation();
	const isLoading = userState.isLoading || providerState.isLoading;
	const { signIn } = useSignIn();

	const [fields, setFields] = useState<Fields>(EMPTY);
	const [errors, setErrors] = useState<FieldErrors>({});
	const [submitted, setSubmitted] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [sentTo, setSentTo] = useState<string | null>(null);
	const [demo, setDemo] = useState<DemoAccount["key"] | null>(null);

	const set = (key: keyof Fields) => (value: string) => {
		const next = { ...fields, [key]: value };
		setFields(next);
		if (submitted) setErrors(validate(next));
	};

	const onSubmit = async () => {
		setSubmitted(true);
		setFormError(null);
		const next = validate(fields);
		setErrors(next);
		if (Object.keys(next).length) return;
		const body = {
			firstName: fields.firstName.trim(),
			lastName: fields.lastName.trim(),
			email: fields.email.trim(),
			password: fields.password,
		};
		try {
			await (role === "provider" ? signupProvider(body) : signupUser(body)).unwrap();
			setSentTo(body.email);
			setFields(EMPTY);
			setSubmitted(false);
		} catch (error) {
			const status = getErrorStatus(error);
			setFormError(
				status === 409
					? getErrorMessage(error, "An account already uses this email. Sign in, or use a different email.")
					: getErrorMessage(error, "Something went wrong. Check your connection and try again."),
			);
		}
	};

	const onDemo = async (account: DemoAccount) => {
		setDemo(account.key);
		const result = await signIn(account.email, account.password);
		setDemo(null);
		if (result.ok) navigation.reset({ index: 0, routes: [{ name: "Home" }] });
		else setFormError("The demo account could not be signed in. Try again in a moment.");
	};

	if (sentTo) {
		return (
			<AuthLayout title="Check your email" subtitle={`We sent a verification link to ${sentTo}. ${copy.success}`}>
				<EmptyState
					bare
					icon={EmailIcon}
					title="Open the link in that email"
					description="It can take a minute to arrive. Check spam if you do not see it."
				/>
				<Button onPress={() => navigation.navigate("Login")} fullWidth>
					Back to sign in
				</Button>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout title={copy.title} subtitle={copy.subtitle}>
			<FormStack>
				{formError ? <Notice tone="error">{formError}</Notice> : null}
				<TextField
					label="First name"
					required
					value={fields.firstName}
					onChangeText={set("firstName")}
					error={errors.firstName}
					autoComplete="given-name"
					textContentType="givenName"
				/>
				<TextField
					label="Last name"
					required
					value={fields.lastName}
					onChangeText={set("lastName")}
					error={errors.lastName}
					autoComplete="family-name"
					textContentType="familyName"
				/>
				<TextField
					label="Email"
					required
					value={fields.email}
					onChangeText={set("email")}
					error={errors.email}
					keyboardType="email-address"
					autoCapitalize="none"
					autoCorrect={false}
					autoComplete="email"
					textContentType="emailAddress"
				/>
				<PasswordField
					label="Password"
					required
					autoComplete="new-password"
					value={fields.password}
					onChangeText={set("password")}
					error={errors.password}
					hint={PASSWORD_HINT}
				/>
				<PasswordField
					label="Confirm password"
					required
					autoComplete="new-password"
					value={fields.confirmPassword}
					onChangeText={set("confirmPassword")}
					error={errors.confirmPassword}
					returnKeyType="go"
					onSubmitEditing={onSubmit}
				/>
				<Button onPress={onSubmit} loading={isLoading} disabled={demo !== null} fullWidth>
					{isLoading ? "Creating account" : copy.submit}
				</Button>
			</FormStack>

			<View style={styles.links}>
				<AuthLinkLine
					text="Already have an account?"
					link="Sign in"
					onPress={() => navigation.navigate("Login")}
				/>
				<AuthLinkLine
					text={copy.switchText}
					link={copy.switchLink}
					onPress={() => navigation.navigate(copy.switchTo)}
				/>
			</View>

			<Divider />
			<DemoAccounts
				context="signup"
				lead={role}
				busy={demo}
				disabled={isLoading || demo !== null}
				onPick={onDemo}
			/>
		</AuthLayout>
	);
}

const styles = StyleSheet.create({
	links: { gap: space[3] },
});
