export interface SLP {
  inProgress: number;
  adventureSLP: number;
  inWallet: number;
  lastClaimed: number;
  total: number;
  hasError: boolean;
}

export function DefaultSLP(): SLP {
  return {
    inProgress: 0,
    adventureSLP: 0,
    inWallet: 0,
    lastClaimed: 0,
    total: 0,
    hasError: false,
  };
}
