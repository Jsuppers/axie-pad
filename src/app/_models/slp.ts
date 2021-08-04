export interface SLP {
  inProgress: number;
  inWallet: number;
  lastClaimed: number;
  total: number;
}

export function DefaultSLP(): SLP {
  return {
    inProgress: 0,
    inWallet: 0,
    lastClaimed: 0,
    total: 0,
  };
}
