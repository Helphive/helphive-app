import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useFetchUserDetailsQuery } from "../../features/auth/authApiSlice";
import { selectCurrentRefreshToken } from "../../features/auth/authSlice";

// Cached user details older than this are refreshed in the background when a screen mounts.
const REVALIDATE_AFTER_SECONDS = 60;

export const useAuthCheck = () => {
	const refreshToken = useSelector(selectCurrentRefreshToken);
	const {
		data: userDetails,
		isLoading: isUserDetailsLoading,
		isFetching: isUserDetailsFetching,
		isError: isUserDetailsError,
		refetch,
	} = useFetchUserDetailsQuery(undefined, {
		// Nothing to ask for until a session exists, and nothing left to show once it is gone.
		skip: !refreshToken,
		refetchOnMountOrArgChange: REVALIDATE_AFTER_SECONDS,
	});

	useEffect(() => {
		if (isUserDetailsError) {
			console.log("An error occurred while fetching user details.");
		}
	}, [isUserDetailsError]);

	return {
		userDetails,
		isUserDetailsLoading,
		isUserDetailsFetching,
		isUserDetailsError,
		refetch,
	};
};
