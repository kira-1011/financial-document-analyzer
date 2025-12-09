import type { Sidebar } from '@/components/ui/sidebar';
import type {
  Organization,
  ActiveOrganization,
  User,
  Invitation,
  UserRole,
  Member,
} from '@/lib/auth-types';

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

// Organization Settings Types
export type OrgState = {
  success?: boolean;
  message?: string;
  errors?: {
    name?: string[];
    slug?: string[];
  };
};

export type MemberActionState = {
  success?: boolean;
  message?: string;
};

// Component Props Types
export interface OrganizationSwitcherProps {
  organizations: Organization[];
  activeOrganization: ActiveOrganization | null;
}

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User;
  organizations: Organization[];
  activeOrganization: ActiveOrganization | null;
}

export interface ProfileFormProps {
  user: User;
}

export interface OrganizationFormProps {
  organization: Organization & { members: Member[] };
  invitations: Invitation[] | null;
  currentUserId: User['id'];
  userRole: UserRole;
  canManage: boolean;
  isOwner: boolean;
}

// Document Upload Types
export type UploadDocumentState = {
  success?: boolean;
  message?: string;
  documentId?: string;
  errors?: {
    file?: string[];
    documentType?: string[];
  };
};
