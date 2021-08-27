
import { Axie } from '../../../_models/axie';
import { HttpClient } from '@angular/common/http';

export class AccountAxies {
  static async getAxies(http: HttpClient, roninAddress: string): Promise<Axie[]> {
    var axies: Axie[] = [];
    if (roninAddress) {
      try {
        // create the leaderboard url
        // TODO check if we can change to offical graphql query
        const url =
          'https://axie-proxy.secret-shop.buzz/_axiesPlease/' +
          roninAddress.replace('ronin:', '0x');

        const output = await http.get<any>(url).toPromise();

        if (output?.available_axies &&
          output?.available_axies?.results &&
          output?.available_axies?.results?.length > 0) {

          (output?.available_axies?.results as any[]).forEach((axie) => {
            axies.push({
              name: axie?.name,
              id: axie?.id,
              image: axie?.image,
              breedCount: axie?.breedCount,
              class: axie?.class,
            });
          })
        }

      } catch (e) {
        console.log(e);
      }
    }

    return axies;
  }
}
