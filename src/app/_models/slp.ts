export interface SLP {
  inProgress: number;
  claimable: number;
  inWallet: number;
  lastClaimed: number;
  total: number;
}

export function DefaultSLP(): SLP {
  return {
    inProgress: 0,
    claimable: 0,
    inWallet: 0,
    lastClaimed: 0,
    total: 0,
  };
}
