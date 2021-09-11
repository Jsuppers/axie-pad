export interface BattleLogs {
  hasError: boolean;
  roninAddress: string;
  battles: Battle[];
}

export interface Battle {
  enemyRoninAddress: string;
  fighters: Fighter[];
  // used for replays
  // e.g axie://?f=rpl&q=battleUuid
  battleUuid: string;
  win: boolean;
  // 0 = PVP, 1 = PVE
  battleType: number;
  timestamp: number;
}


export interface Fighter {
  ownTeam: boolean;
  axieId: string;
}

export function DefaultBattle(): Battle {
  return {
    enemyRoninAddress: '',
    fighters: [],
    battleUuid: '',
    win: false,
    battleType: 0,
    timestamp: 0
  }
}

export function DefaultBattleLogs(roninAddress: string): BattleLogs {
  return {
    hasError: false,
    roninAddress,
    battles: [],
  }
}
