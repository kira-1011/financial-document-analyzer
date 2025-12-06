// Auth Types
export type LoginState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
  success?: boolean;
};

export type SignupState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  message?: string;
  success?: boolean;
};

// Profile Settings Types
export type ProfileState = {
  success?: boolean;
  message?: string;
  errors?: {
    name?: string[];
  };
};

export type PasswordState = {
  success?: boolean;
  message?: string;
  errors?: {
    currentPassword?: string[];
    newPassword?: string[];
    confirmPassword?: string[];
  };
};

export type DeleteAccountState = {
  success?: boolean;
  message?: string;
  errors?: {
    password?: string[];
  };
};

