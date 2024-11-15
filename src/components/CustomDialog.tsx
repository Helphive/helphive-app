import React from "react";
import { Button, Dialog, Portal, Text } from "react-native-paper";

import { useAppTheme } from "../utils/theme";

type Props = {
	title: string;
	message: string | null;
	icon: "alert-circle-outline" | "check-circle-outline";
	iconColor: string;
	buttonText: string;
	buttonAction?: () => void;
	buttonLoading?: boolean;
	hideDialog: () => void;
};

const CustomDialog = (props: Props) => {
	const theme = useAppTheme();

	return (
		<Portal>
			<Dialog
				visible={!!props.message}
				onDismiss={props.hideDialog}
				theme={{ roundness: 2 }}
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: theme.colors.background,
				}}
			>
				<Dialog.Icon icon={props.icon} size={60} color={props.iconColor} />
				<Dialog.Content
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						gap: 6,
						paddingTop: 15,
						paddingBottom: 25,
						paddingLeft: 15,
						paddingRight: 15,
					}}
				>
					<Text variant="titleLarge" style={{ fontFamily: theme.colors.fontSemiBold, textAlign: "center" }}>
						{props.title}
					</Text>
					<Text variant="labelLarge" style={{ fontFamily: theme.colors.fontRegular, textAlign: "center" }}>
						{props.message}
					</Text>
				</Dialog.Content>
				<Dialog.Actions
					style={{
						paddingBottom: 15,
						paddingLeft: 15,
						paddingRight: 15,
					}}
				>
					<Button
						onPress={props.buttonAction || props.hideDialog}
						loading={props.buttonLoading}
						mode="contained"
						className="w-full"
						theme={{ roundness: 2 }}
						style={{
							padding: 2,
						}}
					>
						<Text
							style={{
								color: theme.colors.buttonText,
								fontFamily: theme.colors.fontBold,
							}}
						>
							{props.buttonText}
						</Text>
					</Button>
				</Dialog.Actions>
			</Dialog>
		</Portal>
	);
};

export default CustomDialog;
