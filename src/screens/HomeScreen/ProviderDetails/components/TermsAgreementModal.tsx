import React from "react";
import { Modal, View } from "react-native";
import { useAppTheme } from "../../../../utils/theme";
import { Button, IconButton, Text } from "react-native-paper";

type Props = {
	modalVisible: any;
	setModalVisible: any;
	confirmation: any;
	setConfirmation: any;
};

const TermsAgreementModal = (props: Props) => {
	const { modalVisible, setModalVisible, setConfirmation } = props;
	const theme = useAppTheme();

	return (
		<View>
			<Modal
				animationType="fade"
				transparent={true}
				visible={modalVisible}
				onRequestClose={() => {
					setModalVisible(false);
				}}
			>
				<View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
					<View
						style={{
							backgroundColor: theme.colors.background,
							padding: 20,
							borderTopRightRadius: 20,
							borderTopLeftRadius: 20,
						}}
					>
						<View className="flex flex-row justify-between items-center mb-4">
							<Text
								style={{
									color: theme.colors.onBackground,
									fontFamily: theme.colors.fontSemiBold,
								}}
								variant="titleMedium"
							>
								User Agreement
							</Text>
							<IconButton icon="close" style={{ margin: 0 }} onPress={() => setModalVisible(false)} />
						</View>
						<Text variant="bodyMedium" style={{ color: theme.colors.bodyColor }}>
							I agree that the data related to the account that I have entered will be further verified by
							HelpHive through services provided by third parties
						</Text>
						<Button
							mode="contained"
							className="w-full mt-6"
							theme={{ roundness: 2 }}
							onPress={() => {
								setConfirmation(true);
								setModalVisible(false);
							}}
						>
							<Text
								style={{
									color: theme.colors.buttonText,
									fontFamily: theme.colors.fontBold,
									padding: 5,
								}}
							>
								Agree
							</Text>
						</Button>
						<Button
							className="w-full mt-2 mb-2"
							theme={{ roundness: 2 }}
							onPress={() => {
								setConfirmation(false);
								setModalVisible(false);
							}}
						>
							<Text
								style={{
									fontFamily: theme.colors.fontSemiBold,
									color: theme.colors.primary,
									padding: 5,
								}}
							>
								Cancel
							</Text>
						</Button>
					</View>
				</View>
			</Modal>
		</View>
	);
};

export default TermsAgreementModal;
