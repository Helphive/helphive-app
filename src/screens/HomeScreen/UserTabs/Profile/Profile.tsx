import React, { FC } from "react";
import ProfileForm from "../../../../components/profile/ProfileForm";

interface Props {
	userDetails: any;
}

const Profile: FC<Props> = ({ userDetails }) => <ProfileForm userDetails={userDetails} />;

export default Profile;
