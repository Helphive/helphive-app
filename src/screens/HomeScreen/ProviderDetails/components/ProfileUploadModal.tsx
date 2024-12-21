import React, { useState, useEffect } from "react";
import { Image, Modal, TouchableOpacity, View, Alert, Linking } from "react-native";
import { useAppTheme } from "../../../../utils/theme";
import { IconButton, Text } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";

type Props = {
	modalVisible: any;
	setModalVisible: any;
	document: any;
	setDocument: any;
};

const camera = require("../../../../../assets/icons/camera.png");
const imageGallery = require("../../../../../assets/icons/image-gallery.png");

const ProfileUploadModal = (props: Props) => {
	const { modalVisible, setModalVisible, setDocument } = props;
	const [hasCameraPermission, setHasCameraPermission] = useState(false);
	const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState(false);

	const theme = useAppTheme();

	const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

	useEffect(() => {
		checkPermissions();
	}, []);

	const checkPermissions = async () => {
		const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
		const mediaLibraryPermission = await ImagePicker.getMediaLibraryPermissionsAsync();

		setHasCameraPermission(cameraPermission.status === "granted");
		setHasMediaLibraryPermission(mediaLibraryPermission.status === "granted");
	};

	const handleOptionSelection = (option: any) => {
		setModalVisible(false);
		if (option === "camera") {
			handleCameraOption();
		} else if (option === "gallery") {
			handleGalleryOption();
		}
	};

	const handleCameraOption = async () => {
		if (!hasCameraPermission) {
			requestCameraPermission();
		} else {
			const result = await ImagePicker.launchCameraAsync({
				allowsMultipleSelection: false,
				aspect: [1, 1],
				// allowsEditing: true,
				cameraType: ImagePicker.CameraType.front,
			});
			handleFileSelection(result);
		}
	};

	const handleGalleryOption = async () => {
		if (!hasMediaLibraryPermission) {
			requestMediaLibraryPermission();
		} else {
			const result = await ImagePicker.launchImageLibraryAsync({
				allowsMultipleSelection: false,
				aspect: [1, 1],
				// allowsEditing: true,
			});
			handleFileSelection(result);
		}
	};

	const handleFileSelection = (result: any) => {
		if (!result.canceled) {
			const fileSize = result.assets[0]?.size || result.assets[0]?.fileSize;
			if (fileSize && fileSize > MAX_FILE_SIZE_BYTES) {
				Alert.alert("File size exceeds 10mb limit.");
			} else {
				setDocument(result);
			}
		} else {
			console.log("File selection canceled");
		}
	};

	const requestCameraPermission = async () => {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status === "granted") {
			setHasCameraPermission(true);
		} else {
			handlePermissionDenied("camera");
		}
	};

	const requestMediaLibraryPermission = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status === "granted") {
			setHasMediaLibraryPermission(true);
		} else {
			handlePermissionDenied("media library");
		}
	};

	const handlePermissionDenied = (permissionType: string) => {
		Alert.alert(
			"Permission Required",
			`Please grant permission to access ${permissionType}.`,
			[
				{ text: "Cancel", onPress: () => console.log("Cancel Pressed"), style: "cancel" },
				{ text: "Grant Permission", onPress: () => openAppSettings() },
			],
			{ cancelable: false },
		);
	};

	const openAppSettings = () => {
		Linking.openSettings();
	};

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
						<View className="flex flex-row justify-between items-center">
							<Text
								style={{
									color: theme.colors.onBackground,
									fontFamily: theme.colors.fontSemiBold,
								}}
								variant="titleMedium"
							>
								Upload Document
							</Text>
							<IconButton icon="close" style={{ margin: 0 }} onPress={() => setModalVisible(false)} />
						</View>
						<TouchableOpacity
							className="flex flex-row items-center justify-start p-3"
							onPress={() => handleOptionSelection("camera")}
						>
							<Image source={camera} className="w-7 h-7" />
							<Text className="ml-2" variant="bodyMedium">
								Camera
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							className="flex flex-row items-center justify-start p-3"
							onPress={() => handleOptionSelection("gallery")}
						>
							<Image source={imageGallery} className="w-7 h-7" />
							<Text className="ml-2" variant="bodyMedium">
								Gallery
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</View>
	);
};

export default ProfileUploadModal;
