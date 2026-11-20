import React, { forwardRef, useState } from "react";
import type { TextInputInstance } from "react-native";
import { TextField, type TextFieldProps } from "./TextField";
import { IconButton } from "./IconButton";
import { HidePasswordIcon, ShowPasswordIcon } from "../icons";

export type PasswordFieldProps = Omit<TextFieldProps, "secureTextEntry" | "right"> & {
	/** "current-password" for sign-in (default), "new-password" for sign-up. */
	autoComplete?: "current-password" | "new-password";
};

/** TextField with a labelled show/hide toggle. */
export const PasswordField = forwardRef<TextInputInstance, PasswordFieldProps>(function PasswordField(
	{ autoComplete = "current-password", ...rest },
	ref,
) {
	const [visible, setVisible] = useState(false);
	return (
		<TextField
			ref={ref}
			autoCapitalize="none"
			autoCorrect={false}
			spellCheck={false}
			textContentType={autoComplete === "new-password" ? "newPassword" : "password"}
			autoComplete={autoComplete === "new-password" ? "new-password" : "current-password"}
			{...rest}
			secureTextEntry={!visible}
			right={
				<IconButton
					icon={visible ? HidePasswordIcon : ShowPasswordIcon}
					label={visible ? "Hide password" : "Show password"}
					onPress={() => setVisible((v) => !v)}
				/>
			}
		/>
	);
});

export default PasswordField;
