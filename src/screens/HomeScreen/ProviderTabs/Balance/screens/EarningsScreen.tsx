import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import withAuthCheck from "../../../../../hocs/withAuthCheck";
import { useAppTheme } from "../../../../../utils/theme";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useGetEarningsQuery } from "../../../../../features/provider/providerApiSlice";
import CustomSnackbar from "../../../../../components/CustomSnackbar";
import EmptyState from "../../../../../components/EmptyState";
import Skeleton from "../../../../../components/Skeleton";
import DetailsHeader from "../../../../../components/details/DetailsHeader";
import { PAGE_BACKGROUND, SCREEN_PADDING } from "../../../../../components/details/tokens";
import EarningsCard from "../components/EarningsCard";

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

export default withAuthCheck(EarningsScreen);
