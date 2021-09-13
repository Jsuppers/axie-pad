
import { SLP, DefaultSLP } from '../../../_models/slp';
import { HttpClient } from '@angular/common/http';

export class SLPStats {

      // Example request
  // https://lunacia.skymavis.com/game-api/clients/RONIN_ADDRESS_STARTING_WITH_0x/items/1
  /* {
     "success": true,
    "client_id": "0x961209...f764b61",
    "item_id":1,
    "total":1332,
    "blockchain_related": {
      "signature": {
        "signature": "0x042..45",
        "amount":1661,
        "timestamp":1625474407
      },
      "balance":1,
      "checkpoint":1661,
      "block_number":4837349
   },
  "claimable_total":1,
  "last_claimed_item_at":1625474407,
  "item": {
    "id":1,
    "name": "Breeding Potion",
  "description":"Breeding Potion is required to breed two Axies",
  "image_url":"",
  "updated_at":1576669291,
  "created_at":1576669291,
}
} */
  static async getSLPStats(http: HttpClient, roninAddress: string): Promise<SLP> {
    var slp = DefaultSLP();
    if (roninAddress) {
      try {
        // create the leaderboard url
        const url =
          'https://game-api.skymavis.com/game-api/clients/' +
          roninAddress.replace('ronin:', '0x') +
          '/items/1';

        const output = await http.get<any>(url).toPromise();

        slp.total = output.total;
        slp.inWallet = output?.blockchain_related?.balance ?? 0;
        slp.inProgress = slp.total - slp.inWallet;
        slp.lastClaimed = output.last_claimed_item_at;

      } catch (e) {
        slp.hasError = true;
        console.log(e);
      }
    }

    return slp;
  }
}
