import * as SecureStore from "expo-secure-store";

export const storeRefreshToken = async (token: string) => {
	try {
		await SecureStore.setItemAsync("refreshToken", token);
	} catch (error) {
		console.error("Error storing refresh token:", error);
	}
};

export const getRefreshToken = async () => {
	try {
		const token = await SecureStore.getItemAsync("refreshToken");
		return token;
	} catch (error) {
		console.error("Error retrieving refresh token:", error);
		return null;
	}
};

export const deleteRefreshToken = async () => {
	try {
		await SecureStore.deleteItemAsync("refreshToken");
	} catch (error) {
		console.error("Error deleting refresh token:", error);
	}
};
