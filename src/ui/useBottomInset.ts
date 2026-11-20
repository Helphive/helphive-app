import { useEffect, useState } from "react";
import { Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * The space a bottom bar keeps clear for the system navigation bar. The app draws edge to edge, so the navigation bar
 * covers the bottom inset; while the keyboard is open it covers the navigation bar instead, and the keyboard padding
 * (Screen's KeyboardAvoidingView) already lifts the bar, so the inset drops to 0 to keep the bar on the keyboard.
 */
export function useBottomInset() {
	const { bottom } = useSafeAreaInsets();
	const [keyboard, setKeyboard] = useState(() => Keyboard.isVisible());
	useEffect(() => {
		const show = Keyboard.addListener("keyboardDidShow", () => setKeyboard(true));
		const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboard(false));
		return () => {
			show.remove();
			hide.remove();
		};
	}, []);
	return keyboard ? 0 : bottom;
}
