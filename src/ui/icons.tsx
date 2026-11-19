// The only place the app imports icons. One family: Phosphor (phosphor-react-native), the same glyphs as the web
// (helphive-web/src/components/ui/icons.tsx). Screens import the semantic names below; to change a glyph, change it
// here. Each icon is a deep import so the bundle only carries the icons listed here.
//
// Rules (design-system.md section 7): regular weight at 20px by default; bold only at 16px or smaller; fill only for
// the active tab and selected states; duotone only where the icon is the main visual (service tiles, empty and
// error states). Icons take the text colour around them: pass `color`.
import React from "react";
import type { IconProps, IconWeight } from "phosphor-react-native";
import { color as palette } from "./tokens";

import { ArrowClockwiseIcon } from "phosphor-react-native/src/icons/ArrowClockwise";
import { ArrowLeftIcon } from "phosphor-react-native/src/icons/ArrowLeft";
import { BankIcon } from "phosphor-react-native/src/icons/Bank";
import { BedIcon } from "phosphor-react-native/src/icons/Bed";
import { BellIcon } from "phosphor-react-native/src/icons/Bell";
import { BriefcaseIcon } from "phosphor-react-native/src/icons/Briefcase";
import { BroomIcon } from "phosphor-react-native/src/icons/Broom";
import { CalendarBlankIcon } from "phosphor-react-native/src/icons/CalendarBlank";
import { CalendarCheckIcon } from "phosphor-react-native/src/icons/CalendarCheck";
import { CameraIcon } from "phosphor-react-native/src/icons/Camera";
import { CaretDownIcon } from "phosphor-react-native/src/icons/CaretDown";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { ChatCircleIcon } from "phosphor-react-native/src/icons/ChatCircle";
import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { CheckCircleIcon } from "phosphor-react-native/src/icons/CheckCircle";
import { ClipboardTextIcon } from "phosphor-react-native/src/icons/ClipboardText";
import { ClockIcon } from "phosphor-react-native/src/icons/Clock";
import { CreditCardIcon } from "phosphor-react-native/src/icons/CreditCard";
import { DotsThreeVerticalIcon } from "phosphor-react-native/src/icons/DotsThreeVertical";
import { EnvelopeSimpleIcon } from "phosphor-react-native/src/icons/EnvelopeSimple";
import { EyeIcon } from "phosphor-react-native/src/icons/Eye";
import { EyeSlashIcon } from "phosphor-react-native/src/icons/EyeSlash";
import { FileIcon as PhFileIcon } from "phosphor-react-native/src/icons/File";
import { FlagIcon } from "phosphor-react-native/src/icons/Flag";
import { HouseIcon } from "phosphor-react-native/src/icons/House";
import { ImageIcon } from "phosphor-react-native/src/icons/Image";
import { InfoIcon as PhInfoIcon } from "phosphor-react-native/src/icons/Info";
import { ListMagnifyingGlassIcon } from "phosphor-react-native/src/icons/ListMagnifyingGlass";
import { LockSimpleIcon } from "phosphor-react-native/src/icons/LockSimple";
import { MapPinIcon } from "phosphor-react-native/src/icons/MapPin";
import { MinusIcon } from "phosphor-react-native/src/icons/Minus";
import { PaperPlaneRightIcon } from "phosphor-react-native/src/icons/PaperPlaneRight";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { ProhibitIcon } from "phosphor-react-native/src/icons/Prohibit";
import { ReceiptIcon as PhReceiptIcon } from "phosphor-react-native/src/icons/Receipt";
import { SealCheckIcon } from "phosphor-react-native/src/icons/SealCheck";
import { ShirtFoldedIcon } from "phosphor-react-native/src/icons/ShirtFolded";
import { SignOutIcon } from "phosphor-react-native/src/icons/SignOut";
import { StarIcon } from "phosphor-react-native/src/icons/Star";
import { TrashIcon } from "phosphor-react-native/src/icons/Trash";
import { UserIcon } from "phosphor-react-native/src/icons/User";
import { WalletIcon } from "phosphor-react-native/src/icons/Wallet";
import { WarningIcon as PhWarningIcon } from "phosphor-react-native/src/icons/Warning";
import { WarningCircleIcon } from "phosphor-react-native/src/icons/WarningCircle";
import { XIcon } from "phosphor-react-native/src/icons/X";
// Customer booking (address picker, booking details, receipt)
import { ArrowSquareOutIcon } from "phosphor-react-native/src/icons/ArrowSquareOut";
import { BuildingsIcon } from "phosphor-react-native/src/icons/Buildings";
import { CrosshairSimpleIcon } from "phosphor-react-native/src/icons/CrosshairSimple";
import { MapTrifoldIcon } from "phosphor-react-native/src/icons/MapTrifold";
import { PencilSimpleIcon } from "phosphor-react-native/src/icons/PencilSimple";
import { PhoneIcon as PhPhoneIcon } from "phosphor-react-native/src/icons/Phone";
import { ShareNetworkIcon } from "phosphor-react-native/src/icons/ShareNetwork";

export type { IconWeight };
export interface AppIconProps extends Omit<IconProps, "size"> {
	size?: number;
}
export type AppIcon = React.FC<AppIconProps>;

const icon = (Glyph: React.FC<IconProps>, name: string): AppIcon => {
	const Wrapped: AppIcon = ({ size = 20, weight = "regular", color = palette.ink900, ...rest }) => (
		<Glyph size={size} weight={weight} color={color} duotoneColor={rest.duotoneColor ?? color} {...rest} />
	);
	Wrapped.displayName = name;
	return Wrapped;
};

// Services
export const RoomAttendantIcon = icon(BedIcon, "RoomAttendantIcon");
export const PublicAreaIcon = icon(BroomIcon, "PublicAreaIcon");
export const LinenPorterIcon = icon(ShirtFoldedIcon, "LinenPorterIcon");
export const ServiceIconFallback = icon(BriefcaseIcon, "ServiceIconFallback");

// Navigation
export const HomeIcon = icon(HouseIcon, "HomeIcon");
export const BookingsIcon = icon(CalendarCheckIcon, "BookingsIcon");
export const AvailableOrdersIcon = icon(ListMagnifyingGlassIcon, "AvailableOrdersIcon");
export const OrdersIcon = icon(ClipboardTextIcon, "OrdersIcon");
export const EarningsIcon = icon(WalletIcon, "EarningsIcon");
export const NotificationsIcon = icon(BellIcon, "NotificationsIcon");
export const ProfileIcon = icon(UserIcon, "ProfileIcon");
export const ProviderIcon = icon(BriefcaseIcon, "ProviderIcon");
export const ChatIcon = icon(ChatCircleIcon, "ChatIcon");
export const LogoutIcon = icon(SignOutIcon, "LogoutIcon");
export const BackIcon = icon(ArrowLeftIcon, "BackIcon");
export const CloseIcon = icon(XIcon, "CloseIcon");
export const ChevronRightIcon = icon(CaretRightIcon, "ChevronRightIcon");
export const ChevronDownIcon = icon(CaretDownIcon, "ChevronDownIcon");

// Actions
export const AddIcon = icon(PlusIcon, "AddIcon");
export const RemoveIcon = icon(MinusIcon, "RemoveIcon");
export const CheckMarkIcon = icon(CheckIcon, "CheckMarkIcon");
export const RetryIcon = icon(ArrowClockwiseIcon, "RetryIcon");
export const ShowPasswordIcon = icon(EyeIcon, "ShowPasswordIcon");
export const HidePasswordIcon = icon(EyeSlashIcon, "HidePasswordIcon");
export const PhotoCameraIcon = icon(CameraIcon, "PhotoCameraIcon");
export const PhotoIcon = icon(ImageIcon, "PhotoIcon");

// Data
export const CalendarIcon = icon(CalendarBlankIcon, "CalendarIcon");
export const TimeIcon = icon(ClockIcon, "TimeIcon");
export const LocationIcon = icon(MapPinIcon, "LocationIcon");
export const EmailIcon = icon(EnvelopeSimpleIcon, "EmailIcon");
export const SecureIcon = icon(LockSimpleIcon, "SecureIcon");
export const ReceiptIcon = icon(PhReceiptIcon, "ReceiptIcon");
export const RatingIcon = icon(StarIcon, "RatingIcon");
export const PayoutIcon = icon(BankIcon, "PayoutIcon");
export const PaymentIcon = icon(CreditCardIcon, "PaymentIcon");
export const VerifiedIcon = icon(SealCheckIcon, "VerifiedIcon");

// Status
export const InfoIcon = icon(PhInfoIcon, "InfoIcon");
export const ErrorIcon = icon(WarningCircleIcon, "ErrorIcon");
export const WarningIcon = icon(PhWarningIcon, "WarningIcon");
export const SuccessIcon = icon(CheckCircleIcon, "SuccessIcon");

// Chat and lists
export const SendIcon = icon(PaperPlaneRightIcon, "SendIcon");
export const MoreIcon = icon(DotsThreeVerticalIcon, "MoreIcon");
export const ReportIcon = icon(FlagIcon, "ReportIcon");
export const BlockIcon = icon(ProhibitIcon, "BlockIcon");
export const DeleteIcon = icon(TrashIcon, "DeleteIcon");
export const FileIcon = icon(PhFileIcon, "FileIcon");

// Customer booking (address picker, booking details, receipt)
export const VenueIcon = icon(BuildingsIcon, "VenueIcon");
export const CurrentLocationIcon = icon(CrosshairSimpleIcon, "CurrentLocationIcon");
export const MapIcon = icon(MapTrifoldIcon, "MapIcon");
export const EditIcon = icon(PencilSimpleIcon, "EditIcon");
export const ExternalLinkIcon = icon(ArrowSquareOutIcon, "ExternalLinkIcon");
export const PhoneIcon = icon(PhPhoneIcon, "PhoneIcon");
export const ShareIcon = icon(ShareNetworkIcon, "ShareIcon");
