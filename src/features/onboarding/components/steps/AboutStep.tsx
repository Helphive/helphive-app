import React from "react";
import { Panel, TextField } from "@/ui";
import type { ProviderApplication } from "../../useProviderApplication";
import { FieldStack } from "./FieldStack";

/** Step 1: name, account email (read-only) and phone. */
export function AboutStep({ app }: { app: ProviderApplication }) {
	const { form, errors, setText } = app;
	return (
		<Panel title="About you" subtitle="Confirm who you are and how we can reach you.">
			<FieldStack>
				<TextField
					label="First name"
					required
					value={form.text.firstName}
					onChangeText={setText("firstName")}
					error={errors.firstName}
					autoComplete="given-name"
					textContentType="givenName"
				/>
				<TextField
					label="Last name"
					required
					value={form.text.lastName}
					onChangeText={setText("lastName")}
					error={errors.lastName}
					autoComplete="family-name"
					textContentType="familyName"
				/>
				<TextField
					label="Email"
					required
					value={form.text.email}
					editable={false}
					error={errors.email}
					hint="This is your account email."
				/>
				<TextField
					label="Phone number"
					required
					value={form.text.phone}
					onChangeText={setText("phone")}
					error={errors.phone}
					keyboardType="phone-pad"
					autoComplete="tel"
					textContentType="telephoneNumber"
					placeholder="+44 7700 900123"
				/>
			</FieldStack>
		</Panel>
	);
}
