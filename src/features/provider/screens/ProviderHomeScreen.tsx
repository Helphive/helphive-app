import React, { useMemo, useState } from "react";
import { StyleSheet, Switch, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import dayjs from "dayjs";
import {
	Avatar,
	Button,
	Divider,
	EmptyState,
	ErrorState,
	ListSkeleton,
	PageTitle,
	Panel,
	Screen,
	SelectableTileGroup,
	ShiftRuler,
	Skeleton,
	StatGroup,
	StatTile,
	Text,
	color,
	space,
	useToast,
} from "@/ui";
import { AvailableOrdersIcon, CalendarIcon, RatingIcon } from "@/ui/icons";
import { formatMoney, getDisplayStatus } from "@/lib/format";
import { profileImageUrl } from "@/lib/gcloud";
import { getErrorMessage } from "@/services/api/errors";
import { useAuthCheck } from "@/features/auth/useAuthCheck";
import { useGetMyOrdersQuery } from "@/features/provider/api";
import { useEarnings } from "@/features/earnings/useEarnings";
import OrderCard from "@/features/orders/components/OrderCard";
import { serviceIcon } from "@/features/orders/components/ServiceTile";
import { jobsToday, upcomingJobs, venueName } from "@/features/orders/orderUtils";
import type { Booking } from "@/features/orders/types";
import AvailabilityMap from "../components/AvailabilityMap";
import { JOB_TYPE_IDS, useAvailability } from "../useAvailability";
import { useProviderLocation } from "../useProviderLocation";
import type { JobTypeKey } from "../slice";

const SERVICES: { key: JobTypeKey; title: string }[] = [
	{ key: "publicAreaAttendant", title: "Public area attendant" },
	{ key: "roomAttendant", title: "Room attendant" },
	{ key: "linenPorter", title: "Linen porter" },
];

const greeting = (hour: number) => (hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");

// Coral marks the job under way, ink the others, soft the finished.
const toneOf = (b: Booking) => {
	const s = getDisplayStatus(b);
	return s === "in_progress" || s === "awaiting_start_approval" ? "coral" : s === "completed" ? "soft" : "ink";
};

/** Provider home: who and whether online, the services they take, where they are, today's jobs, a short summary. */
export default function ProviderHomeScreen() {
	const navigation = useNavigation();
	const toast = useToast();
	const { userDetails } = useAuthCheck();
	const location = useProviderLocation();
	const { isAvailable, jobTypes, setOnline, toggleJobType } = useAvailability(location.position);
	const [switching, setSwitching] = useState(false);
	const orders = useGetMyOrdersQuery();
	const earnings = useEarnings();

	const today = useMemo(() => jobsToday(orders.data), [orders.data]);
	const upcoming = useMemo(() => upcomingJobs(orders.data), [orders.data]);

	const goOnline = async (online: boolean) => {
		if (!online) {
			setOnline(false);
			return;
		}
		setSwitching(true);
		const granted = await location.requestAccess();
		setSwitching(false);
		if (granted) setOnline(true);
		else toast.show("Allow location to go online, so customers near you can find you.");
	};

	const now = dayjs();
	const name = [userDetails?.firstName, userDetails?.lastName].filter(Boolean).join(" ") || "Your account";
	const subtitle = orders.isLoading
		? now.format("dddd D MMMM")
		: `${now.format("dddd D MMMM")} · ${today.length ? `${today.length} ${today.length === 1 ? "job" : "jobs"} today` : "No jobs today"}`;
	const approved = (key: JobTypeKey) => userDetails?.jobTypes?.[key] !== false;

	return (
		<Screen
			inTabs
			refreshing={(orders.isFetching && !orders.isLoading) || (earnings.isFetching && !earnings.isLoading)}
			onRefresh={() => {
				orders.refetch();
				earnings.refetch();
			}}
		>
			<PageTitle
				title={`${greeting(now.hour())}${userDetails?.firstName ? `, ${userDetails.firstName}` : ""}`}
				subtitle={subtitle}
			/>

			<Panel>
				<View style={styles.gap}>
					<View style={styles.person}>
						<Avatar
							uri={profileImageUrl(userDetails?.profile)}
							firstName={userDetails?.firstName}
							lastName={userDetails?.lastName}
							size={44}
						/>
						<View style={styles.flex}>
							<Text variant="uiStrong" weight="bold" numberOfLines={1}>
								{name}
							</Text>
							{userDetails?.rating ? (
								<View style={styles.rating}>
									<RatingIcon size={14} weight="fill" color={color.amber500} />
									<Text variant="small">{`${userDetails.rating.toFixed(1)} rating`}</Text>
								</View>
							) : null}
						</View>
					</View>
					<View style={styles.switchRow}>
						<View style={styles.flex}>
							<Text variant="panelTitle">{isAvailable ? "Online" : "Offline"}</Text>
							<Text variant="small" accessibilityLiveRegion="polite">
								{switching
									? "Checking your location"
									: isAvailable
										? "Visible for new orders near you"
										: "Switch on to be visible for new orders"}
							</Text>
						</View>
						<Switch
							accessibilityLabel="Available for new orders"
							value={isAvailable}
							disabled={switching}
							onValueChange={goOnline}
							trackColor={{ false: color.ink200, true: color.green500 }}
							thumbColor={color.surface}
							style={styles.switch}
						/>
					</View>
					<Divider />
					<Text variant="caption">Services you provide</Text>
					<SelectableTileGroup
						accessibilityLabel="Services you provide"
						type="checkbox"
						value={SERVICES.filter((s) => jobTypes[s.key]).map((s) => s.key)}
						onChange={toggleJobType}
						options={SERVICES.map((s) => {
							const Icon = serviceIcon(JOB_TYPE_IDS[s.key]);
							return {
								value: s.key,
								title: s.title,
								description: approved(s.key) ? undefined : "Not approved for your account",
								disabled: !approved(s.key),
								icon: <Icon size={22} color={color.ink600} />,
							};
						})}
					/>
				</View>
			</Panel>

			<Panel
				title="Your location"
				subtitle={location.position ? "Customers see orders near this point" : undefined}
				flush
			>
				<AvailabilityMap
					status={location.status}
					position={location.position}
					onAllow={location.requestAccess}
					onRetry={location.retry}
				/>
			</Panel>

			<TodaysJobs
				jobs={today}
				loading={orders.isLoading}
				error={orders.error && !orders.data ? orders.error : undefined}
				retrying={orders.isFetching}
				onRetry={orders.refetch}
				onOpen={(b) => navigation.navigate("MyOrderDetails", { bookingId: b._id })}
				onBrowse={() => navigation.navigate("ProviderHome", { screen: "OrdersTab" })}
			/>

			<StatGroup columns={2}>
				<StatTile
					label="Upcoming shifts"
					value={orders.isLoading ? <Skeleton width={40} height={24} /> : String(upcoming.length)}
					hint={upcoming[0] ? `Next ${dayjs(upcoming[0].startDate).format("ddd HH:mm")}` : "None booked"}
					action={
						<Button size="sm" variant="text" onPress={() => navigation.navigate("MyOrders")}>
							My orders
						</Button>
					}
				/>
				<StatTile
					label="Available balance"
					value={
						earnings.isLoading ? (
							<Skeleton width={80} height={24} />
						) : earnings.failed ? (
							"—"
						) : (
							formatMoney(earnings.available)
						)
					}
					hint={earnings.failed ? "Could not load" : `${formatMoney(earnings.pending)} pending`}
					action={
						<Button
							size="sm"
							variant="text"
							onPress={() => navigation.navigate("ProviderHome", { screen: "BalanceTab" })}
						>
							Earnings
						</Button>
					}
				/>
			</StatGroup>
		</Screen>
	);
}

function TodaysJobs({
	jobs,
	loading,
	error,
	retrying,
	onRetry,
	onOpen,
	onBrowse,
}: {
	jobs: Booking[];
	loading: boolean;
	error?: unknown;
	retrying: boolean;
	onRetry: () => void;
	onOpen: (b: Booking) => void;
	onBrowse: () => void;
}) {
	if (loading) return <ListSkeleton rows={2} />;
	const hours = jobs.reduce((sum, j) => sum + (Number(j.hours) || 0), 0);
	return (
		<Panel
			title="Today's shifts"
			subtitle={
				jobs.length
					? `${jobs.length} ${jobs.length === 1 ? "job" : "jobs"}, ${hours} ${hours === 1 ? "hour" : "hours"}`
					: undefined
			}
			flush
		>
			{error ? (
				<ErrorState
					bare
					title="Could not load your jobs"
					message={getErrorMessage(error, "Check your connection and try again.")}
					onRetry={onRetry}
					retrying={retrying}
				/>
			) : jobs.length === 0 ? (
				<EmptyState
					bare
					icon={CalendarIcon}
					title="No jobs today"
					description="Jobs you accept for today appear here with their times."
					action={
						<Button variant="secondary" icon={AvailableOrdersIcon} onPress={onBrowse}>
							Browse available orders
						</Button>
					}
				/>
			) : (
				<>
					<View style={styles.ruler}>
						<ShiftRuler
							now={dayjs()}
							blocks={jobs.map((j) => ({
								key: j._id,
								start: j.startDate,
								hours: Number(j.hours) || 1,
								label: venueName(j),
								tone: toneOf(j),
							}))}
						/>
					</View>
					{jobs.map((j) => (
						<OrderCard key={j._id} booking={j} onPress={onOpen} showStatus />
					))}
				</>
			)}
		</Panel>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	gap: { gap: space[3] },
	person: { flexDirection: "row", alignItems: "center", gap: space[3] },
	rating: { flexDirection: "row", alignItems: "center", gap: 4 },
	switchRow: { flexDirection: "row", alignItems: "center", gap: space[3], minHeight: 48 },
	switch: { transform: [{ scaleX: 1.15 }, { scaleY: 1.15 }] },
	ruler: { padding: space[4] },
});
