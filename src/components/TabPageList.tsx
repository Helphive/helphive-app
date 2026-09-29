import React from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useAppTheme } from "../utils/theme";
import EmptyState from "./EmptyState";
import Skeleton from "./Skeleton";

interface TabPageListProps<T> {
	data: T[];
	renderItem: (info: { item: T; index: number }) => React.ReactElement | null;
	keyExtractor: (item: T, index: number) => string;
	refreshing: boolean;
	onRefresh: () => void;
	loading?: boolean;
	empty: { icon: React.ComponentProps<typeof EmptyState>["icon"]; title: string; message?: string };
}

const CardSkeleton = () => (
	<View
		style={{
			padding: 16,
			borderRadius: 12,
			backgroundColor: "#fff",
			marginBottom: 12,
			borderWidth: 1,
			borderColor: "#EAECF0",
		}}
	>
		<Skeleton width={80} height={18} radius={9} />
		<Skeleton width="60%" height={18} style={{ marginTop: 12 }} />
		<Skeleton width="90%" height={14} style={{ marginTop: 10 }} />
		<Skeleton width="40%" height={14} style={{ marginTop: 10 }} />
	</View>
);

/** Vertical page (also usable standalone): pull-to-refresh, skeleton while first loading, empty state. */
function TabPageList<T>({
	data,
	renderItem,
	keyExtractor,
	refreshing,
	onRefresh,
	loading,
	empty,
}: TabPageListProps<T>) {
	const theme = useAppTheme();
	if (loading && data.length === 0) {
		return (
			<View style={{ padding: 16 }}>
				{[0, 1, 2].map((i) => (
					<CardSkeleton key={i} />
				))}
			</View>
		);
	}
	return (
		<FlatList
			data={data}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			nestedScrollEnabled
			showsVerticalScrollIndicator={false}
			initialNumToRender={6}
			maxToRenderPerBatch={6}
			windowSize={7}
			removeClippedSubviews
			ListEmptyComponent={<EmptyState icon={empty.icon} title={empty.title} message={empty.message} />}
			contentContainerStyle={{ padding: 16, flexGrow: 1 }}
			refreshControl={
				<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
			}
		/>
	);
}

export default TabPageList;
