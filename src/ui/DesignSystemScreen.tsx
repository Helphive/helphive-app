import React, { useState } from "react";
import { StyleSheet, Switch, View } from "react-native";
import {
	Avatar,
	BookingStatusPill,
	BottomSheet,
	Button,
	ConfirmDialog,
	Count,
	EmptyState,
	ErrorState,
	IconButton,
	ListRow,
	ListSkeleton,
	Notice,
	Panel,
	PasswordField,
	Screen,
	ScreenHeader,
	SelectableTileGroup,
	ShiftRuler,
	StatGroup,
	StatTile,
	StatusPill,
	StepProgress,
	Text,
	TextField,
	space,
	useToast,
} from "@/ui";
import { makeStyles, useTheme, type ColorName, type ThemePreference } from "@/ui";
import {
	BookingsIcon,
	LinenPorterIcon,
	LocationIcon,
	NotificationsIcon,
	PayoutIcon,
	PublicAreaIcon,
	RoomAttendantIcon,
	TimeIcon,
} from "@/ui/icons";

/**
 * Every design-system component with a small example. Dev builds only: open helphive://dev/ui
 * (`adb shell am start -a android.intent.action.VIEW -d "helphive://dev/ui"`). Copy from here when building screens.
 */
export default function DesignSystemScreen() {
	const { color } = useTheme();
	const toast = useToast();
	const [service, setService] = useState<string | null>("room");
	const [slot, setSlot] = useState<string | null>("08:00");
	const [sheet, setSheet] = useState(false);
	const [dialog, setDialog] = useState(false);
	const [email, setEmail] = useState("");
	const [online, setOnline] = useState(true);

	return (
		<Screen header={<ScreenHeader title="Design system" />}>
			<ThemeSection />
			<Section title="Type">
				<Text variant="title">Page title 28</Text>
				<Text variant="heading">Heading 20</Text>
				<Text variant="subheading">Subheading 18</Text>
				<Text variant="panelTitle">Panel title 16</Text>
				<Text variant="body">Body 16 for reading text.</Text>
				<Text>UI 14 is the default for controls and lists.</Text>
				<Text variant="small">Small 13 for secondary lines.</Text>
				<Text variant="caption">Caption 12 for data labels</Text>
				<Text variant="figure">$1,240.50</Text>
			</Section>

			<Section title="Buttons">
				<Button onPress={() => toast.success("Booking saved")}>Proceed to payment</Button>
				<Button variant="secondary" icon={BookingsIcon} onPress={() => {}}>
					View bookings
				</Button>
				<Button variant="ink" onPress={() => {}}>
					Accept order
				</Button>
				<View style={styles.row}>
					<Button size="sm" variant="secondary" onPress={() => {}}>
						Small
					</Button>
					<Button size="sm" loading onPress={() => {}}>
						Saving
					</Button>
					<Button variant="text" onPress={() => {}}>
						Text button
					</Button>
				</View>
				<Button variant="danger" onPress={() => setDialog(true)}>
					Cancel booking
				</Button>
			</Section>

			<Section title="Fields">
				<TextField
					label="Email"
					required
					value={email}
					onChangeText={setEmail}
					keyboardType="email-address"
					hint="We send booking updates here."
				/>
				<TextField label="Last name" required value="" error="Enter your last name" />
				<PasswordField label="Password" required />
			</Section>

			<Section title="Selectable tiles">
				<SelectableTileGroup
					accessibilityLabel="Service"
					value={service}
					onChange={setService}
					options={[
						{
							value: "public",
							title: "Public area attendant",
							description: "Lobbies, corridors and shared spaces",
							icon: <PublicAreaIcon />,
						},
						{
							value: "room",
							title: "Room attendant",
							description: "Guest room cleaning and turnover",
							icon: <RoomAttendantIcon />,
						},
						{
							value: "linen",
							title: "Linen porter",
							description: "Linen handling and distribution",
							icon: <LinenPorterIcon />,
						},
					]}
				/>
				<SelectableTileGroup
					accessibilityLabel="Start time"
					size="compact"
					value={slot}
					onChange={setSlot}
					options={["06:00", "07:00", "08:00", "09:00", "10:00", "12:00", "14:00", "16:00"].map((t) => ({
						value: t,
						title: t,
					}))}
				/>
			</Section>

			<Section title="Status">
				<View style={styles.wrap}>
					<BookingStatusPill status="scheduled" />
					<BookingStatusPill status="accepted" />
					<BookingStatusPill status="awaiting_start_approval" />
					<BookingStatusPill status="completed" />
					<BookingStatusPill status="cancelled" />
					<StatusPill tone="green" size="md">
						Paid
					</StatusPill>
					<Count value={3} />
					<Count value={12} tone="coral" />
				</View>
				<Notice tone="info">Your booking stays scheduled until a provider accepts it.</Notice>
				<Notice tone="error" title="Payment failed">
					Your card was declined. Use a different card.
				</Notice>
			</Section>

			<Section title="Shift ruler">
				<ShiftRuler blocks={[{ start: "09:00", hours: 6 }]} />
				<ShiftRuler
					now="12:30"
					blocks={[
						{ start: "07:00", hours: 3, tone: "ink", label: "Hilton" },
						{ start: "13:00", hours: 5, label: "Savoy, room attendant" },
					]}
				/>
				<ShiftRuler blocks={[{ start: "20:00", end: "02:00", tone: "soft" }]} />
			</Section>

			<Section title="Step progress">
				<StepProgress
					current={2}
					steps={[
						{ label: "Service" },
						{ label: "Date and time", short: "Date" },
						{ label: "Hours and rate", short: "Hours" },
						"Address",
						"Payment",
					]}
				/>
			</Section>

			<Panel title="Today's jobs" subtitle="Panel with list rows" actions={<Count value={2} />} flush>
				<ListRow
					title="Room attendant, The Savoy"
					subtitle="Thu 20 Nov, 09:00 to 15:00"
					left={<View style={[styles.bar, { backgroundColor: color.coral500 }]} />}
					right={<BookingStatusPill status="accepted" />}
					onPress={() => {}}
				/>
				<ListRow
					title="Linen porter, Hilton"
					subtitle="Fri 21 Nov, 07:00 to 10:00"
					left={<View style={[styles.bar, { backgroundColor: color.inkFill }]} />}
					onPress={() => {}}
				/>
				<ListRow
					title="Available for work"
					subtitle="Customers nearby can book you"
					left={<LocationIcon color={color.ink600} />}
					right={
						<Switch
							value={online}
							onValueChange={setOnline}
							trackColor={{ true: color.green500, false: color.ink200 }}
							thumbColor={color.onBrand}
						/>
					}
				/>
			</Panel>

			<StatGroup columns={2}>
				<StatTile
					featured
					label="Available balance"
					value="$1,240.50"
					action={<Button size="sm">Withdraw</Button>}
				/>
				<StatTile label="Pending" value="$320.00" hint="Released after completion" />
				<StatTile label="Jobs this month" value="14" />
			</StatGroup>

			<Section title="Avatars and icon buttons">
				<View style={styles.row}>
					<Avatar firstName="Maiz" lastName="Provider" size={40} />
					<Avatar firstName="Ali" size={32} />
					<IconButton icon={NotificationsIcon} label="Notifications" />
					<IconButton icon={TimeIcon} label="Time" />
				</View>
			</Section>

			<EmptyState
				icon={PayoutIcon}
				title="No payouts yet"
				description="Payouts appear here after your first completed job."
				action={<Button variant="secondary">Browse available orders</Button>}
			/>
			<ErrorState
				title="Could not load your bookings"
				message="Check your connection and try again."
				onRetry={() => {}}
			/>
			<ListSkeleton rows={2} />

			<Section title="Overlays">
				<Button variant="secondary" onPress={() => setSheet(true)}>
					Open bottom sheet
				</Button>
				<Button variant="secondary" onPress={() => toast.error("Could not cancel the booking")}>
					Show error toast
				</Button>
			</Section>

			<BottomSheet
				visible={sheet}
				onClose={() => setSheet(false)}
				title="Filter bookings"
				footer={
					<Button style={styles.flex} onPress={() => setSheet(false)}>
						Apply
					</Button>
				}
			>
				<Text color="ink600">Bottom sheets hold short choices and secondary actions.</Text>
			</BottomSheet>
			<ConfirmDialog
				visible={dialog}
				title="Cancel this booking?"
				description="The provider is told at once. Cancelling within 24 hours of the start is not refunded."
				confirmLabel="Cancel booking"
				destructive
				onConfirm={() => setDialog(false)}
				onClose={() => setDialog(false)}
			/>
		</Screen>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<Panel title={title}>
			<View style={styles.stack}>{children}</View>
		</Panel>
	);
}

const SWATCH_GROUPS: { title: string; names: ColorName[] }[] = [
	{ title: "Surfaces", names: ["canvas", "subtle", "surface", "raised", "skeleton", "line", "lineStrong"] },
	{ title: "Ink", names: ["ink900", "ink700", "ink600", "ink500", "ink300", "ink200"] },
	{ title: "Coral", names: ["coral500", "coral600", "coral700", "coral100", "coral50"] },
	{
		title: "Fills and their text",
		names: [
			"brandFill",
			"brandFillHover",
			"onBrand",
			"inkFill",
			"onInk",
			"greenFill",
			"blueFill",
			"amberFill",
			"redFill",
		],
	},
	{ title: "Green", names: ["green700", "green500", "green200", "green50"] },
	{ title: "Blue", names: ["blue700", "blue500", "blue200", "blue50"] },
	{ title: "Amber", names: ["amber700", "amber500", "amber200", "amber50"] },
	{ title: "Red", names: ["red700", "red500", "red200", "red50"] },
	{ title: "Overlay", names: ["scrim"] },
];

const CHOICES: { value: ThemePreference; label: string }[] = [
	{ value: "system", label: "System" },
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
];

/** The active scheme, a switch for it, and every token with its value: the one place to review a scheme. */
function ThemeSection() {
	const { color, scheme, preference, setPreference } = useTheme();
	const themed = useStyles();
	return (
		<>
			<Section title={`Theme: ${scheme} (${preference})`}>
				<View style={styles.row}>
					{CHOICES.map((c) => (
						<Button
							key={c.value}
							size="sm"
							variant={preference === c.value ? "ink" : "secondary"}
							onPress={() => setPreference(c.value)}
						>
							{c.label}
						</Button>
					))}
				</View>
			</Section>
			{SWATCH_GROUPS.map((g) => (
				<Section key={g.title} title={g.title}>
					<View style={styles.wrap}>
						{g.names.map((name) => (
							<View key={name} style={themed.swatchCell}>
								<View style={[themed.swatch, { backgroundColor: color[name] }]} />
								<Text variant="caption">{name}</Text>
								<Text variant="small">{color[name]}</Text>
							</View>
						))}
					</View>
				</Section>
			))}
			<Section title="Text on each background">
				{(["canvas", "subtle", "surface", "raised"] as const).map((bg) => (
					<View key={bg} style={[themed.sample, { backgroundColor: color[bg] }]}>
						<Text variant="uiStrong">{`${bg}: primary`}</Text>
						<Text color="ink700">strong secondary</Text>
						<Text color="ink600">secondary</Text>
						<Text color="ink500">muted</Text>
						<Text color="coral600">coral link</Text>
					</View>
				))}
			</Section>
		</>
	);
}

const useStyles = makeStyles(({ color }) => ({
	swatchCell: { width: "30%", gap: 2 },
	swatch: { height: 36, borderRadius: 6, borderWidth: 1, borderColor: color.lineStrong },
	sample: { padding: space[3], borderRadius: 6, borderWidth: 1, borderColor: color.line, gap: 2 },
}));

const styles = StyleSheet.create({
	stack: { gap: space[3] },
	row: { flexDirection: "row", alignItems: "center", gap: space[2] },
	wrap: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
	bar: { width: 4, height: 36, borderRadius: 2 },
	flex: { flex: 1 },
});
