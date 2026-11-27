import { AccountState, RegulationsVersion } from '../core/account/account.models';

export const regulationsV1: RegulationsVersion = {
  version: 1,
  effectiveOn: '2026-11-27',
  changes: ['First edition of the SkyBridge Regulations and Privacy Policy.']
};

export const regulationsV2: RegulationsVersion = {
  version: 2,
  effectiveOn: '2027-02-01',
  changes: ['Time acceleration is now allowed above FL300.', 'PIREPs must be filed within 24 hours.']
};

export const activeAccount: AccountState = {
  status: 'Active',
  reactivationReadyAtUtc: null,
  acceptedRegulationsVersion: 1,
  currentRegulationsVersion: 1,
  pendingRegulations: []
};