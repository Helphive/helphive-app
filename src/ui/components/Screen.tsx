import React, { useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Pressable, RefreshControl, ScrollView, View, type ViewStyle } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { Text } from "../Text";
import { layout, space } from "../tokens";
import { makeStyles, useTheme } from "../theme";
import { BackIcon, NotificationsIcon } from "../icons";
import { IconButton } from "./IconButton";
import { Logo } from "./Logo";
import { Avatar } from "./Avatar";

export interface ScreenProps {
	/** Bar at the top: <ScreenHeader>, <AppHeader>, or nothing (auth screens). */
	header?: ReactNode;
	children: ReactNode;
	/** Scrolls by default. Pass false for screens that manage their own list (FlatList) or fill the screen. */
	scroll?: boolean;
	/** Sticky bar under the content (the screen's primary action). */
	footer?: ReactNode;
	/** Surface (white) instead of the canvas: auth and form-only screens. */
	surface?: boolean;
	/** Pull to refresh. */
	refreshing?: boolean;
	onRefresh?: () => void;
	/** Content padding is the 16px gutter with 20px between sections; override here. */
	contentStyle?: ViewStyle;
	/** Inside a tab shell the tab bar owns the bottom inset. */
	inTabs?: boolean;
	/**
	 * Does not scroll or bounce while the content fits (short forms like sign-in). It scrolls again as soon as the content
	 * is taller than the screen: keyboard open, large font scale, an extra error message.
	 */
	fit?: boolean;
}

/**
 * The scaffold every screen starts from: safe area, status bar, background, header, keyboard handling, scroll,
 * gutters and a sticky footer. Screens put layout inside it and keep data logic in hooks.
 */
export function Screen({
	header,
	children,
	scroll = true,
	footer,
	surface,
	refreshing,
	onRefresh,
	contentStyle,
	inTabs,
	fit,
}: ScreenProps) {
	const { color, scheme } = useTheme();
	const styles = useStyles();
	const insets = useSafeAreaInsets();
	const bg = surface ? color.surface : color.canvas;
	const [view, setView] = useState(0);
	const [contentHeight, setContentHeight] = useState(0);
	// flexGrow makes the content at least as tall as the viewport, so equal heights mean it fits.
	const fits = !!fit && view > 0 && contentHeight > 0 && contentHeight <= view + 1;
	const content = scroll ? (
		<ScrollView
			style={styles.flex}
			onLayout={fit ? (e) => setView(e.nativeEvent.layout.height) : undefined}
			onContentSizeChange={fit ? (_w, h) => setContentHeight(h) : undefined}
			scrollEnabled={!fits}
			bounces={!fits}
			overScrollMode={fits ? "never" : "auto"}
			contentContainerStyle={[
				styles.content,
				fit && styles.grow,
				!footer && !inTabs && { paddingBottom: insets.bottom + space[6] },
				contentStyle,
			]}
			keyboardShouldPersistTaps="handled"
			refreshControl={
				onRefresh ? (
					<RefreshControl
						refreshing={!!refreshing}
						onRefresh={onRefresh}
						tintColor={color.ink900}
						colors={[color.ink900]}
						progressBackgroundColor={color.raised}
					/>
				) : undefined
			}
		>
			{children}
		</ScrollView>
	) : (
		<View style={[styles.flex, contentStyle]}>{children}</View>
	);
	return (
		// With a header, the header pads itself for the status bar (it also runs inside tab shells, outside any Screen);
		// inside a tab shell the shell's header already does.
		<SafeAreaView
			edges={header || inTabs ? ["left", "right"] : ["top", "left", "right"]}
			style={[styles.flex, { backgroundColor: header ? color.surface : bg }]}
		>
			<StatusBar style={scheme === "dark" ? "light" : "dark"} />
			{header}
			{/* Android draws edge to edge (SDK 54+), so the window no longer shrinks for the keyboard: pad on both. */}
			<KeyboardAvoidingView style={[styles.flex, { backgroundColor: bg }]} behavior="padding">
				{content}
				{footer ? (
					<View style={[styles.footer, { paddingBottom: (inTabs ? 0 : insets.bottom) + space[3] }]}>
						{footer}
					</View>
				) : null}
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

export interface ScreenHeaderProps {
	title: string;
	/** Back arrow; on by default when the stack can go back. */
	back?: boolean;
	onBack?: () => void;
	actions?: ReactNode;
}

/** Top bar for stack screens: back, title, actions. White with a hairline, no shadow. */
export function ScreenHeader({ title, back, onBack, actions }: ScreenHeaderProps) {
	const styles = useStyles();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const showBack = back ?? navigation.canGoBack();
	return (
		<View style={[styles.header, { paddingTop: insets.top, height: layout.headerHeight + insets.top }]}>
			{showBack ? (
				<IconButton icon={BackIcon} label="Back" onPress={onBack ?? (() => navigation.goBack())} />
			) : (
				<View style={styles.headerSpacer} />
			)}
			<Text variant="subheading" numberOfLines={1} accessibilityRole="header" style={styles.flex}>
				{title}
			</Text>
			<View style={styles.headerActions}>{actions}</View>
		</View>
	);
}

export interface AppHeaderProps {
	unreadCount?: number;
	onNotifications: () => void;
	user?: { firstName?: string; lastName?: string; avatarUrl?: string | null } | null;
	onProfile?: () => void;
}

/** Tab-shell top bar, as the web's phone top bar: logo, bell with unread count, avatar. */
export function AppHeader({ unreadCount = 0, onNotifications, user, onProfile }: AppHeaderProps) {
	const styles = useStyles();
	const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);
	const insets = useSafeAreaInsets();
	return (
		<View style={[styles.header, { paddingTop: insets.top, height: layout.headerHeight + insets.top }]}>
			<View style={[styles.flex, styles.logo]}>
				<Logo size={28} />
			</View>
			<IconButton
				icon={NotificationsIcon}
				label={unreadCount ? `Notifications, ${unreadLabel} unread` : "Notifications"}
				onPress={onNotifications}
				badge={
					unreadCount ? (
						<View style={styles.badge}>
							<Text variant="caption" weight="bold" style={styles.badgeText}>
								{unreadLabel}
							</Text>
						</View>
					) : null
				}
			/>
			{onProfile ? (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Profile"
					onPress={onProfile}
					hitSlop={6}
					style={({ pressed }) => [styles.avatarButton, pressed && { opacity: 0.7 }]}
				>
					<Avatar uri={user?.avatarUrl} firstName={user?.firstName} lastName={user?.lastName} size={32} />
				</Pressable>
			) : null}
		</View>
	);
}

/** The page title inside the content: 28/800, with an optional line under it. One per screen. */
export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
	const styles = useStyles();
	return (
		<View style={styles.pageTitle}>
			<View style={styles.flex}>
				<Text variant="title" accessibilityRole="header">
					{title}
				</Text>
				{subtitle ? (
					<Text variant="body" color="ink600" style={styles.subtitle}>
						{subtitle}
					</Text>
				) : null}
			</View>
			{actions}
		</View>
	);
}

const useStyles = makeStyles(({ color }) => ({
	flex: { flex: 1 },
	grow: { flexGrow: 1 },
	content: { padding: layout.gutter, gap: space[5] },
	footer: {
		backgroundColor: color.surface,
		borderTopWidth: 1,
		borderTopColor: color.line,
		paddingHorizontal: layout.gutter,
		paddingTop: space[3],
		flexDirection: "row",
		alignItems: "center",
		gap: space[3],
	},
	header: {
		height: layout.headerHeight,
		flexDirection: "row",
		alignItems: "center",
		gap: space[1],
		paddingHorizontal: space[2],
		backgroundColor: color.surface,
		borderBottomWidth: 1,
		borderBottomColor: color.line,
	},
	headerSpacer: { width: space[2] },
	headerActions: { flexDirection: "row", alignItems: "center" },
	logo: { paddingLeft: space[2] },
	badge: {
		minWidth: 18,
		height: 18,
		paddingHorizontal: 4,
		borderRadius: 9,
		backgroundColor: color.brandFill,
		borderWidth: 2,
		borderColor: color.surface,
		alignItems: "center",
		justifyContent: "center",
	},
	badgeText: { color: color.onBrand, fontSize: 10, lineHeight: 12 },
	avatarButton: { marginHorizontal: space[2] },
	pageTitle: { flexDirection: "row", alignItems: "flex-start", gap: space[3] },
	subtitle: { marginTop: space[1] },
}));
