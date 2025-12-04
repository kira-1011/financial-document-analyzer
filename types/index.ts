// Auth Types
export type LoginState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
};

export type SignupState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  message?: string;
};

