export interface SLP {
  claimable: number;
  lastClaimed: number;
  total: number;
}

export function DefaultSLP(): SLP {
  return {
    claimable: 0,
    lastClaimed: 0,
    total: 0,
  };
}
