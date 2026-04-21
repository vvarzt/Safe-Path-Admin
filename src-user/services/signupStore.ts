export interface PendingProfile {
  email?: string;
  password?: string;
  fullName?: string;
  username?: string;
  idCard?: string;
  phone?: string;
  phoneVerified?: boolean;
  birthDate?: string;
  gender?: string;
  occupation?: string;
  address?: string;
  profileImage?: string;
  statusApp?: string;
  pin?: string;
}

let pendingProfile: PendingProfile | null = null;

export const setPendingProfile = (data: PendingProfile | null) => {
  pendingProfile = data;
};

export const getPendingProfile = (): PendingProfile | null => pendingProfile;

export const clearPendingProfile = () => {
  pendingProfile = null;
};
