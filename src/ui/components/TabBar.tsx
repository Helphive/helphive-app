import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Text } from "../Text";
import { color, layout } from "../tokens";
import type { AppIcon } from "../icons";

export interface TabItem {
	label: string;
	icon: AppIcon;
	/** A count shown on the icon (unread chats). */
	badge?: number;
}

/**
 * The bottom tab bar: white, hairline on top, regular icons that switch to fill and coral when active, ink labels.
 * Pass `items` keyed by route name: `tabBar={(props) => <TabBar {...props} items={ITEMS} />}`.
 */
export function TabBar({ state, navigation, items }: BottomTabBarProps & { items: Record<string, TabItem> }) {
	const insets = useSafeAreaInsets();
	return (
		<View
			style={[styles.bar, { paddingBottom: insets.bottom, height: layout.tabBarHeight + insets.bottom }]}
			accessibilityRole="tablist"
		>
			{state.routes.map((route, index) => {
				const item = items[route.name];
				if (!item) return null;
				const active = state.index === index;
				const Icon = item.icon;
				const onPress = () => {
					const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
					if (!active && !event.defaultPrevented) navigation.navigate(route.name, route.params);
				};
				return (
					<Pressable
						key={route.key}
						accessibilityRole="tab"
						accessibilityState={{ selected: active }}
						accessibilityLabel={item.badge ? `${item.label}, ${item.badge} new` : item.label}
						onPress={onPress}
						onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
						style={styles.item}
					>
						<View>
							<Icon
								size={24}
								weight={active ? "fill" : "regular"}
								color={active ? color.coral600 : color.ink600}
							/>
							{item.badge ? <View style={styles.dot} /> : null}
						</View>
						<Text
							variant="caption"
							weight={active ? "bold" : "semibold"}
							color={active ? "ink900" : "ink600"}
							numberOfLines={1}
						>
							{item.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	bar: {
		flexDirection: "row",
		backgroundColor: color.surface,
		borderTopWidth: 1,
		borderTopColor: color.line,
	},
	item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
	dot: {
		position: "absolute",
		top: -1,
		right: -3,
		width: 9,
		height: 9,
		borderRadius: 5,
		backgroundColor: color.coral500,
		borderWidth: 1.5,
		borderColor: color.surface,
	},
});

export default TabBar;
