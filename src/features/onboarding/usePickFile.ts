import { useCallback } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useEnsurePermission } from "@/services/permissions";
import { extensionOf, type PickedFile } from "./application";

export type FileSource = "camera" | "photos" | "files";

const FILE_TYPES = [
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"image/*",
];

const fromImage = (asset: ImagePicker.ImagePickerAsset, fallbackName: string): PickedFile => {
	const type = asset.mimeType ?? "image/jpeg";
	const fromUri = asset.uri.split("/").pop() ?? "";
	const name = asset.fileName || (extensionOf(fromUri) ? fromUri : `${fallbackName}.${type.split("/")[1] ?? "jpg"}`);
	return { uri: asset.uri, name, type, size: asset.fileSize, isImage: true };
};

const fromDocument = (asset: DocumentPicker.DocumentPickerAsset): PickedFile => {
	const type = asset.mimeType ?? "application/octet-stream";
	return { uri: asset.uri, name: asset.name, type, size: asset.size, isImage: type.startsWith("image/") };
};

/**
 * Picks one file from the camera, the photo library or the file browser. The camera and photo permissions are asked
 * only when the person chooses that source (with the app's explanation first). Resolves null when cancelled or denied.
 */
export function usePickFile() {
	const ensure = useEnsurePermission();
	return useCallback(
		async (source: FileSource, options: { square?: boolean; name: string }): Promise<PickedFile | null> => {
			const imageOptions: ImagePicker.ImagePickerOptions = {
				mediaTypes: ["images"],
				quality: 0.8,
				allowsEditing: !!options.square,
				aspect: options.square ? [1, 1] : undefined,
			};
			if (source === "camera") {
				if (!(await ensure("camera"))) return null;
				const result = await ImagePicker.launchCameraAsync({
					...imageOptions,
					cameraType: options.square ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
				});
				return result.canceled ? null : fromImage(result.assets[0], options.name);
			}
			if (source === "photos") {
				if (!(await ensure("photos"))) return null;
				const result = await ImagePicker.launchImageLibraryAsync(imageOptions);
				return result.canceled ? null : fromImage(result.assets[0], options.name);
			}
			const result = await DocumentPicker.getDocumentAsync({
				type: FILE_TYPES,
				multiple: false,
				copyToCacheDirectory: true,
			});
			return result.canceled ? null : fromDocument(result.assets[0]);
		},
		[ensure],
	);
}
