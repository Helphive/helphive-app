import React from "react";
import { Image, Linking, View } from "react-native";
import { Avatar, IconButton, Text } from "react-native-paper";
import { useAppTheme } from "../../utils/theme";
import { getGcloudBucketHelphiveUsersUrl } from "../../utils/gcloud-strings";
import InfoCard from "./InfoCard";
import { TEXT_STRONG } from "./tokens";

type Props = {
	title: string;
	person?: { firstName?: string; lastName?: string; email?: string; phone?: string; profile?: string } | null;
	onChat?: () => void;
	showActions?: boolean;
};

const PersonCard = ({ title, person, onChat, showActions = true }: Props) => {
	const theme = useAppTheme();
	if (!person) return null;
	const name = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() || "—";

	return (
		<InfoCard title={title}>
			<View style={{ flexDirection: "row", alignItems: "center" }}>
				{person.profile ? (
					<Image
						source={{ uri: getGcloudBucketHelphiveUsersUrl(person.profile) }}
						style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#F2F4F7" }}
					/>
				) : (
					<Avatar.Icon size={52} icon="account" color="#98A2B3" style={{ backgroundColor: "#F2F4F7" }} />
				)}
				<View style={{ flex: 1, marginLeft: 12 }}>
					<Text style={{ fontFamily: theme.colors.fontSemiBold, color: TEXT_STRONG, fontSize: 16 }}>
						{name}
					</Text>
					{!!person.email && (
						<Text numberOfLines={1} style={{ color: theme.colors.bodyColor, fontSize: 13 }}>
							{person.email}
						</Text>
					)}
				</View>
				{showActions && !!person.phone && (
					<IconButton
						icon="phone"
						mode="contained-tonal"
						accessibilityLabel="Call"
						onPress={() => Linking.openURL(`tel:${person.phone}`)}
					/>
				)}
				{showActions && !!onChat && (
					<IconButton
						icon="chat-processing-outline"
						mode="contained-tonal"
						accessibilityLabel="Chat"
						onPress={onChat}
					/>
				)}
			</View>
		</InfoCard>
	);
};

export default PersonCard;
