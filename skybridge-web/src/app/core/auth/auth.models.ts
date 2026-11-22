export interface LoginResponse {
  requiresTwoFactor: boolean;
  accessToken: string | null;
  expiresAtUtc: string | null;
  twoFactorToken: string | null;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  twoFactorEnabled: boolean;
  roles: string[];
}

export interface TwoFactorSetup {
  sharedKey: string;
  authenticatorUri: string;
}

export interface RecoveryCodes {
  recoveryCodes: string[];
}