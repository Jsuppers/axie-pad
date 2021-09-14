import { HttpClient } from '@angular/common/http';
import { retry } from 'rxjs/operators';
import { DefaultLeaderboardDetails, LeaderboardDetails } from '../../../_models/leaderboard';

const maxInt = '2147483647';
export class LeaderboardStats {
  static async getLeaderBoardStats(http: HttpClient, roninAddress: string): Promise<LeaderboardDetails> {
    var leaderboardDetails = DefaultLeaderboardDetails();

    if (roninAddress && roninAddress.length > 0) {
      try {
        // create the leaderboard url
        // TODO change to official api when they release it
        const url = 'https://api.lunaciaproxy.cloud/_stats/' +
          roninAddress.replace('ronin:', '0x');

        // send and wait for the request
        const output: any = await http.get<any>(url).pipe(retry(3)).toPromise();

        // if the rank is set as the max Int the address is invalid
        if (output?.stats?.rank === maxInt) {
          throw 'unknown address';
        }
        // update leaderboard details
        leaderboardDetails.wins = output?.stats?.win_total ?? 0;
        leaderboardDetails.loses = output?.stats?.lose_total ?? 0;
        leaderboardDetails.draws = output?.stats?.draw_total ?? 0;
        leaderboardDetails.elo = output?.stats?.elo ?? 0;
        leaderboardDetails.rank = output?.stats?.rank ?? 0;
      } catch (e) {
        console.log(e);
      }
    }

    return leaderboardDetails;
  }
}
