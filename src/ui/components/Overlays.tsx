import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../Text";
import { color, radius, shadow, space } from "../tokens";
import { CloseIcon, ErrorIcon, SuccessIcon } from "../icons";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

export interface BottomSheetProps {
	visible: boolean;
	onClose: () => void;
	title?: string;
	children: ReactNode;
	/** Actions pinned under the content (primary last). */
	footer?: ReactNode;
}

/** Slides up from the bottom over a scrim. Tap outside, the close button or Android back closes it. */
export function BottomSheet({ visible, onClose, title, children, footer }: BottomSheetProps) {
	const insets = useSafeAreaInsets();
	const y = useRef(new Animated.Value(1)).current;
	useEffect(() => {
		Animated.timing(y, {
			toValue: visible ? 0 : 1,
			duration: visible ? 260 : 180,
			easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
			useNativeDriver: true,
		}).start();
	}, [visible, y]);
	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
			<Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
			<Animated.View
				accessibilityViewIsModal
				style={[
					styles.sheet,
					{ paddingBottom: insets.bottom + space[4] },
					{ transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, 600] }) }] },
				]}
			>
				<View style={styles.grabber} />
				{title ? (
					<View style={styles.sheetHeader}>
						<Text variant="subheading" accessibilityRole="header" style={styles.flex}>
							{title}
						</Text>
						<IconButton icon={CloseIcon} label="Close" onPress={onClose} />
					</View>
				) : null}
				<View style={styles.sheetBody}>{children}</View>
				{footer ? <View style={styles.sheetFooter}>{footer}</View> : null}
			</Animated.View>
		</Modal>
	);
}

export interface ConfirmDialogProps {
	visible: boolean;
	/** A question: "Cancel this booking?" */
	title: string;
	description?: string;
	/** The verb: "Cancel booking". */
	confirmLabel: string;
	cancelLabel?: string;
	destructive?: boolean;
	loading?: boolean;
	onConfirm: () => void;
	onClose: () => void;
	children?: ReactNode;
}

/** Centred dialog for confirming one action. The confirm button names the verb. */
export function ConfirmDialog({
	visible,
	title,
	description,
	confirmLabel,
	cancelLabel = "Keep it",
	destructive,
	loading,
	onConfirm,
	onClose,
	children,
}: ConfirmDialogProps) {
	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
			<View style={styles.center}>
				<Pressable
					style={StyleSheet.absoluteFill}
					onPress={loading ? undefined : onClose}
					accessibilityLabel="Close"
				/>
				<View style={styles.dialog} accessibilityViewIsModal>
					<Text variant="subheading" accessibilityRole="header">
						{title}
					</Text>
					{description ? (
						<Text variant="ui" color="ink600">
							{description}
						</Text>
					) : null}
					{children}
					<View style={styles.dialogActions}>
						<Button variant="secondary" onPress={onClose} disabled={loading} style={styles.flex}>
							{cancelLabel}
						</Button>
						<Button
							variant={destructive ? "danger" : "primary"}
							onPress={onConfirm}
							loading={loading}
							style={styles.flex}
						>
							{confirmLabel}
						</Button>
					</View>
				</View>
			</View>
		</Modal>
	);
}

// ---- Toast ---------------------------------------------------------------------------------------------------

type ToastTone = "neutral" | "success" | "error";
interface ToastMessage {
	id: number;
	message: string;
	tone: ToastTone;
}
interface ToastApi {
	show: (message: string, tone?: ToastTone) => void;
	success: (message: string) => void;
	error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Ink toast at the bottom, above the tab bar. Wrap the app once (App.tsx does); use `useToast()` anywhere. */
export function ToastProvider({ children }: { children: ReactNode }) {
	const [toast, setToast] = useState<ToastMessage | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const opacity = useRef(new Animated.Value(0)).current;
	const insets = useSafeAreaInsets();

	const hide = useCallback(() => {
		Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => setToast(null));
	}, [opacity]);

	const show = useCallback(
		(message: string, tone: ToastTone = "neutral") => {
			clearTimeout(timer.current);
			setToast({ id: Date.now(), message, tone });
			Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
			timer.current = setTimeout(hide, tone === "error" ? 6000 : 4000);
		},
		[hide, opacity],
	);
	useEffect(() => () => clearTimeout(timer.current), []);

	const api = useMemo<ToastApi>(
		() => ({ show, success: (m) => show(m, "success"), error: (m) => show(m, "error") }),
		[show],
	);
	const Icon = toast?.tone === "error" ? ErrorIcon : toast?.tone === "success" ? SuccessIcon : null;
	return (
		<ToastContext.Provider value={api}>
			{children}
			{toast ? (
				<Animated.View
					pointerEvents="box-none"
					style={[styles.toastWrap, { bottom: insets.bottom + 80, opacity }]}
				>
					<View style={styles.toast} accessibilityLiveRegion="polite" accessibilityRole="alert">
						{Icon ? (
							<Icon size={18} color={toast.tone === "error" ? color.red500 : color.green500} />
						) : null}
						<Text variant="ui" style={styles.toastText}>
							{toast.message}
						</Text>
						<IconButton icon={CloseIcon} label="Dismiss" size={18} color={color.ink300} onPress={hide} />
					</View>
				</Animated.View>
			) : null}
		</ToastContext.Provider>
	);
}

export function useToast(): ToastApi {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error("useToast must be used inside ToastProvider");
	return ctx;
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	scrim: { ...StyleSheet.absoluteFill, backgroundColor: color.scrim },
	sheet: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: color.surface,
		borderTopLeftRadius: radius.lg,
		borderTopRightRadius: radius.lg,
		maxHeight: "90%",
		...shadow.float,
	},
	grabber: {
		alignSelf: "center",
		width: 36,
		height: 4,
		borderRadius: 2,
		backgroundColor: color.ink200,
		marginTop: space[2],
	},
	sheetHeader: {
		flexDirection: "row",
		alignItems: "center",
		paddingLeft: space[4],
		paddingRight: space[2],
		paddingTop: space[2],
	},
	sheetBody: { paddingHorizontal: space[4], paddingTop: space[2], gap: space[3] },
	sheetFooter: { flexDirection: "row", gap: space[2], paddingHorizontal: space[4], paddingTop: space[4] },
	center: {
		flex: 1,
		backgroundColor: color.scrim,
		alignItems: "center",
		justifyContent: "center",
		padding: space[6],
	},
	dialog: {
		alignSelf: "stretch",
		backgroundColor: color.surface,
		borderRadius: radius.lg,
		padding: space[5],
		gap: space[3],
		...shadow.float,
	},
	dialogActions: { flexDirection: "row", gap: space[2], marginTop: space[2] },
	toastWrap: { position: "absolute", left: space[4], right: space[4] },
	toast: {
		flexDirection: "row",
		alignItems: "center",
		gap: space[2],
		backgroundColor: color.ink900,
		borderRadius: radius.md,
		paddingLeft: space[4],
		paddingRight: space[1],
		minHeight: 52,
		...shadow.float,
	},
	toastText: { flex: 1, color: color.surface, paddingVertical: space[3] },
});
