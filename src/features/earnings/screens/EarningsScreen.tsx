import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useAppTheme } from "@/ui/paperTheme";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useGetEarningsQuery } from "@/features/provider/api";
import CustomSnackbar from "@/ui/legacy/CustomSnackbar";
import EmptyState from "@/ui/legacy/EmptyState";
import Skeleton from "@/ui/legacy/Skeleton";
import DetailsHeader from "@/features/bookings/details/DetailsHeader";
import { PAGE_BACKGROUND, SCREEN_PADDING } from "@/features/bookings/details/tokens";
import EarningsCard from "@/features/earnings/components/EarningsCard";

const EarningsScreen = () => {
	const theme = useAppTheme();
	const navigation = useNavigation();
	const { data: earningsData, refetch, isFetching, isLoading, error } = useGetEarningsQuery();
	const listRef = useRef<FlatList>(null);
	const [snackbarVisible, setSnackbarVisible] = useState(false);

	const earnings: any[] = Array.isArray(earningsData?.earnings) ? earningsData.earnings : [];

	const refreshAndTop = useCallback(() => {
		refetch();
		listRef.current?.scrollToOffset({ offset: 0, animated: true });
	}, [refetch]);

	useFocusEffect(refreshAndTop);

	useEffect(() => {
		if (error) setSnackbarVisible(true);
	}, [error]);

	useEffect(() => {
		const unsubscribe = navigation.addListener("tabPress" as never, refreshAndTop);
		return unsubscribe;
	}, [navigation, refreshAndTop]);

	return (
		<View style={{ flex: 1, backgroundColor: PAGE_BACKGROUND }}>
			<DetailsHeader title="Your earnings" />
			<FlatList
				ref={listRef}
				data={earnings}
				keyExtractor={(item) => String(item._id)}
				renderItem={({ item }) => <EarningsCard earning={item} />}
				contentContainerStyle={{ padding: SCREEN_PADDING, gap: 12, flexGrow: 1 }}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl refreshing={isFetching} onRefresh={refetch} colors={[theme.colors.primary]} />
				}
				ListEmptyComponent={
					isLoading ? (
						<View style={{ gap: 12 }}>
							<Skeleton width="100%" height={140} radius={16} />
							<Skeleton width="100%" height={140} radius={16} />
						</View>
					) : (
						<EmptyState
							icon="cash-multiple"
							title="No earnings yet"
							message="Once you complete an order, the upcoming amount will show up here."
						/>
					)
				}
			/>
			<CustomSnackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
				Failed to refresh earnings. Please try again.
			</CustomSnackbar>
		</View>
	);
};

export default EarningsScreen;
