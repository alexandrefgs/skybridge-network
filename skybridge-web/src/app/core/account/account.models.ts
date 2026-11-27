export type AccountStatus = 'Active' | 'Inactive' | 'Reactivating';

export interface RegulationsVersion {
  version: number;
  effectiveOn: string;
  changes: string[];
}

export interface AccountState {
  status: AccountStatus;
  reactivationReadyAtUtc: string | null;
  acceptedRegulationsVersion: number | null;
  currentRegulationsVersion: number;
  pendingRegulations: RegulationsVersion[];
}

export interface Regulations {
  currentVersion: number;
  history: RegulationsVersion[];
}