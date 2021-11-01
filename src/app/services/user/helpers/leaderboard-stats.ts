import { HttpClient } from '@angular/common/http';
import { retryWhen } from 'rxjs/operators';
import { DefaultLeaderboardDetails, LeaderboardDetails } from '../../../_models/leaderboard';
import { retryStrategy } from './retry-strategy';

const maxInt = '2147483647';
export class LeaderboardStats {
  static async getLeaderBoardStats(http: HttpClient, roninAddress: string): Promise<LeaderboardDetails> {
    var leaderboardDetails = DefaultLeaderboardDetails();

    if (roninAddress && roninAddress.length > 0) {
      try {
        // create the leaderboard url
        // TODO change to official api when they release it

        const url = 'https://game-api.axie.technology/api/v1/' +
          roninAddress.replace('ronin:', '0x');

        // send and wait for the request
        const output: any = await http.get<any>(url).pipe(retryWhen(retryStrategy())).toPromise();

        // if the rank is set as the max Int the address is invalid
        if (output?.rank === maxInt) {
          throw 'unknown address';
        }
        // update leaderboard details
        leaderboardDetails.wins = output?.win_total ?? 0;
        leaderboardDetails.loses = output?.lose_total ?? 0;
        leaderboardDetails.draws = output?.draw_total ?? 0;
        leaderboardDetails.elo = output?.mmr ?? 0;
        leaderboardDetails.rank = output?.rank ?? 0;
      } catch (e) {
        leaderboardDetails.hasError = true;
        console.log(e);
      }
    }

    return leaderboardDetails;
  }
}
