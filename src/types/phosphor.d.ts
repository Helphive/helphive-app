// Icons are imported one file at a time from phosphor-react-native's source (see ui/icons.tsx), so the type checker
// reads that source. It passes `className` to <Svg>, which react-native-svg's props do not declare.
import "react-native-svg";

declare module "react-native-svg" {
	interface SvgProps {
		className?: string;
	}
}
