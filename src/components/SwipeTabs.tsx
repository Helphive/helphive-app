import React, { useCallback, useMemo, useRef, useState } from "react";
import {
	Animated,
	FlatList,
	NativeScrollEvent,
	NativeSyntheticEvent,
	TouchableOpacity,
	View,
	useWindowDimensions,
} from "react-native";
import { Text } from "react-native-paper";
import { useAppTheme } from "../utils/theme";

export interface SwipeTab {
	key: string;
	label: string;
	count?: number;
}

interface SwipeTabsProps {
	tabs: SwipeTab[];
	initialIndex?: number;
	/** Rendered lazily, only once the page has been visited (or is about to be). */
	renderPage: (tabKey: string, index: number) => React.ReactElement;
	onIndexChange?: (index: number) => void;
}

const TAB_BAR_HEIGHT = 46;

/**
 * Horizontal paging tabs. The indicator follows the scroll offset on the native driver so swiping never
 * touches the JS thread per frame, and pages mount lazily.
 */
const SwipeTabs = ({ tabs, initialIndex = 0, renderPage, onIndexChange }: SwipeTabsProps) => {
	const theme = useAppTheme();
	const { width } = useWindowDimensions();
	const listRef = useRef<FlatList<SwipeTab>>(null);
	const scrollX = useRef(new Animated.Value(initialIndex * width)).current;
	const activeRef = useRef(initialIndex);
	const [activeIndex, setActiveIndex] = useState(initialIndex);
	const [visited, setVisited] = useState<Set<number>>(() => new Set([initialIndex]));

	const markVisited = useCallback((...indices: number[]) => {
		const valid = indices.filter((i) => i >= 0);
		setVisited((prev) => {
			if (valid.every((i) => prev.has(i))) return prev;
			const next = new Set(prev);
			valid.forEach((i) => next.add(i));
			return next;
		});
	}, []);

	const updateActive = useCallback(
		(index: number) => {
			if (index === activeRef.current || index < 0 || index >= tabs.length) return;
			activeRef.current = index;
			setActiveIndex(index);
			onIndexChange?.(index);
		},
		[onIndexChange, tabs.length],
	);

	const onScroll = useMemo(
		() =>
			Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
				useNativeDriver: true,
				listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
					updateActive(Math.round(e.nativeEvent.contentOffset.x / width));
				},
			}),
		[scrollX, updateActive, width],
	);

	const onTabPress = (index: number) => {
		markVisited(index);
		listRef.current?.scrollToIndex({ index, animated: true });
	};

	// Mount neighbours as soon as a drag starts so the next page is ready before it slides in.
	const onScrollBeginDrag = () => markVisited(activeRef.current - 1, activeRef.current + 1);

	const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
		const index = Math.round(e.nativeEvent.contentOffset.x / width);
		updateActive(index);
		markVisited(index);
	};

	const lastIndex = Math.max(tabs.length - 1, 1);
	const tabWidth = width / tabs.length;
	const indicatorTranslate = scrollX.interpolate({
		inputRange: [0, width * lastIndex],
		outputRange: [0, tabWidth * lastIndex],
		extrapolate: "clamp",
	});

	const renderItem = useCallback(
		({ item, index }: { item: SwipeTab; index: number }) => (
			<View style={{ width, flex: 1 }}>{visited.has(index) ? renderPage(item.key, index) : null}</View>
		),
		[renderPage, visited, width],
	);

	return (
		<View style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<View
				style={{
					height: TAB_BAR_HEIGHT,
					flexDirection: "row",
					borderBottomWidth: 1,
					borderBottomColor: "#EAECF0",
					backgroundColor: theme.colors.background,
				}}
			>
				{tabs.map((tab, index) => {
					const active = index === activeIndex;
					return (
						<TouchableOpacity
							key={tab.key}
							style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" }}
							onPress={() => onTabPress(index)}
							accessibilityRole="tab"
							accessibilityState={{ selected: active }}
						>
							<Text
								style={{
									fontFamily: active ? theme.colors.fontSemiBold : theme.colors.fontMedium,
									color: active ? theme.colors.primary : theme.colors.bodyColor,
									fontSize: 14,
								}}
							>
								{tab.label}
							</Text>
							{tab.count !== undefined && (
								<View
									style={{
										marginLeft: 6,
										minWidth: 20,
										paddingHorizontal: 6,
										height: 20,
										borderRadius: 10,
										alignItems: "center",
										justifyContent: "center",
										backgroundColor: active ? theme.colors.primary : "#F2F4F7",
									}}
								>
									<Text
										style={{
											fontFamily: theme.colors.fontSemiBold,
											fontSize: 11,
											lineHeight: 14,
											color: active ? theme.colors.onPrimary : theme.colors.bodyColor,
										}}
									>
										{tab.count}
									</Text>
								</View>
							)}
						</TouchableOpacity>
					);
				})}
				<Animated.View
					pointerEvents="none"
					style={{
						position: "absolute",
						bottom: 0,
						left: 0,
						width: tabWidth,
						height: 3,
						borderTopLeftRadius: 3,
						borderTopRightRadius: 3,
						backgroundColor: theme.colors.primary,
						transform: [{ translateX: indicatorTranslate }],
					}}
				/>
			</View>

			<Animated.FlatList
				ref={listRef as any}
				data={tabs}
				horizontal
				pagingEnabled
				bounces={false}
				showsHorizontalScrollIndicator={false}
				keyExtractor={(t: SwipeTab) => t.key}
				renderItem={renderItem as any}
				extraData={visited}
				getItemLayout={(_: unknown, index: number) => ({ length: width, offset: width * index, index })}
				initialScrollIndex={initialIndex}
				initialNumToRender={tabs.length}
				// No removeClippedSubviews here: on Android it can blank pages that contain nested lists.
				windowSize={3}
				scrollEventThrottle={16}
				onScroll={onScroll}
				onScrollBeginDrag={onScrollBeginDrag}
				onMomentumScrollEnd={onMomentumEnd}
				style={{ flex: 1 }}
			/>
		</View>
	);
};

export default SwipeTabs;
