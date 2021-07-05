export class LeaderboardDetails {
  name: string;
  elo: number;
  rank: number;
  wins: number;
  loses: number;
  draws: number;
}

export function DefaultLeaderboardDetails(): LeaderboardDetails {
  return {
    name: 'unknown',
    draws: 0,
    elo: 0,
    loses: 0,
    rank: 0,
    wins: 0,
  };
}
