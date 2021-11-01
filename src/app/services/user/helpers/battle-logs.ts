import { HttpClient } from '@angular/common/http';
import { isArray } from 'lodash';
import { Battle, BattleLogs, DefaultBattleLogs, Fighter } from '../../../_models/battle';

export class BattleInfo {
  static async getBattleLogs(http: HttpClient, roninAddress: string): Promise<BattleLogs> {
    var battleLogs = DefaultBattleLogs(roninAddress);

    if (roninAddress && roninAddress.length > 0) {
      try {
        const replacedRoninAddress = roninAddress.replace('ronin:', '0x');
        const url = 'https://game-api.axie.technology/battlelog/' + replacedRoninAddress;

        // send and wait for the request
        const output = await http.get<any>(url).toPromise();
        // address may be invalid
        if (!output || !isArray(output) ||output.length === 0) {
          throw 'no data';
        }

        output.forEach((battles) => {
          const pvpBattles = battles?.items ?? [];
          pvpBattles.forEach((pvpBattle) => {
            var ownTeam: number;
            var ownTeamID: string;
            var enemyAddress: string;
            if (pvpBattle['first_client_id'] === replacedRoninAddress) {
              ownTeam = 0;
              enemyAddress = pvpBattle['second_client_id'];
              ownTeamID = pvpBattle['first_team_id'];
            } else {
              ownTeam = 1;
              enemyAddress = pvpBattle['first_client_id'];
              ownTeamID = pvpBattle['second_team_id'];
            }

            var fighters: Fighter[] = [];
            var pvpFighters = (pvpBattle['fighters'] ?? []) as any[];
            pvpFighters.forEach((pvpFighter) => {
              fighters.push({
                ownTeam: pvpFighter['team_id'] === ownTeamID,
                axieId: pvpFighter['fighter_id'],
              })
            });

            const battle: Battle = {
              enemyRoninAddress: enemyAddress,
              fighters: fighters,
              battleUuid: pvpBattle['battle_uuid'],
              win: pvpBattle['winner'] === ownTeam,
              battleType: pvpBattle['battle_type'],
              timestamp: pvpBattle['created_at']
            };
            battleLogs.battles.push(battle);
          });
        });
      } catch (e) {
        battleLogs.hasError = true;
        console.log(e);
      }
    }

    return battleLogs;
  }
}
