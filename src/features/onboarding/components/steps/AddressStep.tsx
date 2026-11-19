import React from "react";
import { Panel, TextField } from "@/ui";
import type { ProviderApplication } from "../../useProviderApplication";
import { FieldStack } from "./FieldStack";

/** Step 2: the provider's home address. */
export function AddressStep({ app }: { app: ProviderApplication }) {
	const { form, errors, setText } = app;
	return (
		<Panel title="Your address" subtitle="Where you live. We use it to verify your application.">
			<FieldStack>
				<TextField
					label="Street address"
					required
					value={form.text.street}
					onChangeText={setText("street")}
					error={errors.street}
					autoComplete="street-address"
					textContentType="fullStreetAddress"
				/>
				<TextField
					label="Town or city"
					required
					value={form.text.city}
					onChangeText={setText("city")}
					error={errors.city}
					autoComplete="postal-address-locality"
					textContentType="addressCity"
				/>
				<TextField
					label="County or state"
					required
					value={form.text.state}
					onChangeText={setText("state")}
					error={errors.state}
					autoComplete="postal-address-region"
					textContentType="addressState"
				/>
				<TextField
					label="Country"
					required
					value={form.text.country}
					onChangeText={setText("country")}
					error={errors.country}
					autoComplete="postal-address-country"
					textContentType="countryName"
				/>
			</FieldStack>
		</Panel>
	);
}
