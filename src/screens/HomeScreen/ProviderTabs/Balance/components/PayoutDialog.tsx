import React from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { Button, Dialog, HelperText, Portal, TextInput } from "react-native-paper";
import { useAppTheme } from "../../../../../utils/theme";

type Props = {
	visible: boolean;
	amount: string;
	loading: boolean;
	onChange: (value: string) => void;
	onConfirm: () => void;
	onDismiss: () => void;
};

export const isValidPayoutAmount = (amount: string) => /^\d+$/.test(amount) && Number(amount) >= 20;

const PayoutDialog = ({ visible, amount, loading, onChange, onConfirm, onDismiss }: Props) => {
	const theme = useAppTheme();
	const invalid = amount.length > 0 && !isValidPayoutAmount(amount);

	return (
		<Portal>
			<Dialog
				visible={visible}
				onDismiss={loading ? undefined : onDismiss}
				style={{ backgroundColor: theme.colors.background }}
			>
				<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
					<Dialog.Title style={{ fontFamily: theme.colors.fontBold, color: theme.colors.onBackground }}>
						Withdraw funds
					</Dialog.Title>
					<Dialog.Content>
						<TextInput
							mode="outlined"
							label="Amount in USD (minimum $20)"
							value={amount}
							onChangeText={onChange}
							keyboardType="number-pad"
							left={<TextInput.Affix text="$" />}
							error={invalid}
							autoFocus
						/>
						<HelperText type="error" visible={invalid}>
							Enter a whole-dollar amount of at least $20.
						</HelperText>
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={onDismiss} disabled={loading}>
							Cancel
						</Button>
						<Button
							mode="contained"
							onPress={onConfirm}
							loading={loading}
							disabled={loading || !isValidPayoutAmount(amount)}
							labelStyle={{ fontFamily: theme.colors.fontBold }}
						>
							Confirm
						</Button>
					</Dialog.Actions>
				</KeyboardAvoidingView>
			</Dialog>
		</Portal>
	);
};

export default PayoutDialog;
