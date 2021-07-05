import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { FirestoreScholar, Scholar } from '../_models/scholar';
import { HttpClient } from '@angular/common/http';
import { map, publishReplay, refCount, switchMap } from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';
import { User } from '../_models/user';
import { isEmpty } from 'lodash';
import { DefaultSLP, SLP } from '../_models/slp';
import { DefaultLeaderboardDetails, LeaderboardDetails } from '../_models/leaderboard';
import { Apollo, gql } from 'apollo-angular';


// Suppose our profile query took an avatar size
const GET_PROFILE_NAME_BY_RONIN_ADDRESS = gql`
  query GetProfileNameByRoninAddress($roninAddress: String!) {
    publicProfileWithRoninAddress(roninAddress: $roninAddress) {
      accountId
      name
      __typename
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestoreScholars$: BehaviorSubject<FirestoreScholar[]> = new BehaviorSubject<FirestoreScholar[]>([]);
  private scholars$: BehaviorSubject<Scholar[]> = new BehaviorSubject<Scholar[]>([]);
  private fiatPrices$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private fiatCurrency$: BehaviorSubject<string> = new BehaviorSubject<string>('usd');
  private roninAddressNames: Map<string, string> = new Map<string, string>();

  constructor(private service: AuthService,
              private db: AngularFirestore,
              private apollo: Apollo,
              private http: HttpClient,
  ) {
    this.db.collection('users').doc(this.service.userState.uid).get().toPromise().then(async (userDocument) => {
      if (!userDocument || !userDocument.exists) {
        await userDocument.ref.set({
          scholars: {},
          currency: 'usd',
        }, {merge: true});
      }

      this.db.collection('users').doc(this.service.userState.uid).valueChanges()
        .subscribe(async (user: User) => {
          const scholars = Object.values(user.scholars ?? {}) as FirestoreScholar[];
          const currency = user.currency ?? 'usd';
          this.fiatCurrency$.next(currency);
          this.setCurrency(currency);
          this.firestoreScholars$.next(scholars);
        });
    });

    this.firestoreScholars$.pipe(
      switchMap((scholars) => {
        const output: Observable<Scholar>[] = [];
        for (const scholar of scholars) {
          output.push(fromPromise(this.getScholarWithSLP(scholar)));
        }
        return combineLatest(output);
      }),
      // cached result of transformation
      publishReplay(),
      refCount(),
    ).subscribe((scholars) => {
      this.scholars$.next(scholars);
    });
  }


  refresh(): void {
    this.firestoreScholars$.next(this.firestoreScholars$.getValue());
  }

  setCurrency(currency: string): void {
    this.pollPrice(currency).then((price) => this.fiatPrices$.next(price));
  }

  getScholars(): Observable<Scholar[]> {
    return this.scholars$.asObservable();
  }

  getTotalSLP(): Observable<number> {
    return this.getScholars().pipe(map((scholars) => {
      let total = 0;
      scholars.forEach((scholar) => {
        total += scholar?.slp?.total ?? 0;
      });
      return total;
    }));
  }

  getFiatCurrency(): Observable<string> {
    return this.fiatCurrency$.asObservable();
  }

  getTotalFiat(): Observable<number> {
    return combineLatest([this.getTotalSLP(), this.fiatPrices$]).pipe(map(([total, fiatPrice]) => {
      return total * fiatPrice;
    }));
  }

  async pollPrice(fiatCurrency: string): Promise<number> {
    try {
      const slpAddress = '0xcc8fa225d80b9c7d42f96e9570156c65d6caaa25';
      const api = 'https://api.coingecko.com/api/v3/simple/token_price/ethereum';
      const url = api + '?contract_addresses=' + slpAddress + '&vs_currencies=' + fiatCurrency;
      const output = await this.http.get<any>(url).toPromise();
      return output[slpAddress][fiatCurrency];
    } catch (e) {
      return 0;
    }
  }

  private async getScholarWithSLP(scholar: FirestoreScholar): Promise<Scholar> {
    const slp = await this.getSLP(scholar);
    const leaderboardDetails = await this.getLeaderBoardDetails(scholar);
    return {
      ...scholar,
      leaderboardDetails,
      slp,
      roninName: leaderboardDetails.name,
      scholarRoninName: await this.getRoninName(scholar.scholarRoninAddress),
    };
  }

  // Example request
  // https://lunacia.skymavis.com/game-api/clients/RONIN_ADDRESS_STARTING_WITH_0x/items/1
  private async getSLP(scholar: FirestoreScholar): Promise<SLP> {
    const slp = DefaultSLP();
    if (!scholar.roninAddress) {
      return slp;
    }
    try {
      // TODO poll again every x seconds
      const url = 'https://lunacia.skymavis.com/game-api/clients/' + scholar.roninAddress.replace('ronin:', '0x') + '/items/1';
      const output = await this.http.get<any>(url).toPromise();
      if (output) {
        slp.total = output.total;
        slp.claimable = output.claimable_total;
        slp.lastClaimed = output.last_claimed_item_at;
      }
    } catch (e) {
      console.log(e);
    }
    return slp;
  }


  // Example request
  // https://lunacia.skymavis.com/game-api/leaderboard?client_id=RONIN_ADDRESS_STARTING_WITH_0x&offset=0&limit=0
  // {
  //   'success': true,
  //   'items':
  //   [{
  //     'client_id': '0xdeb5c66ca2a0206afdc4fc4a325ff44d614281dd',
  //     'win_total': 78,
  //     'draw_total': 1,
  //     'lose_total': 71,
  //     'elo': 1306,
  //     'rank': 85932,
  //     'name': '#5 Scholarship'
  //   }],
  //    'offset': 0,
  //    'limit': 0,
  // }
  private async getLeaderBoardDetails(scholar: FirestoreScholar): Promise<LeaderboardDetails> {
    const leaderboardDetails = DefaultLeaderboardDetails();
    if (!scholar.roninAddress) {
      return leaderboardDetails;
    }
    const url = 'https://lunacia.skymavis.com/game-api/leaderboard?client_id=' + scholar.roninAddress.replace('ronin:', '0x') + '&offset=0&limit=0';
    try {
      // TODO poll again every x seconds
      const output = await this.http.get<any>(url).toPromise();
      if (!isEmpty(output.items)) {
        leaderboardDetails.name = output.items[0].name;
        leaderboardDetails.elo = output.items[0].elo;
        leaderboardDetails.rank = output.items[0].rank;
        leaderboardDetails.wins = output.items[0].win_total;
        leaderboardDetails.draws = output.items[0].draw_total;
        leaderboardDetails.loses = output.items[0].lose_total;
      }
    } catch (e) {
      console.log(e);
    }

    return leaderboardDetails;
  }


  /**
   * TODO batch requests
   * @param roninAddress
   * @private
   */
  private async getRoninName(roninAddress: string): Promise<string> {
    if (this.roninAddressNames.has(roninAddress)) {
      return this.roninAddressNames.get(roninAddress);
    }
    if (roninAddress.length === 0) {
      return '';
    }
    try {
      const data: any = await this.apollo.query({
        query: GET_PROFILE_NAME_BY_RONIN_ADDRESS,
        variables: {
          roninAddress: roninAddress.replace('ronin:', '0x'),
        },
      }).toPromise();

      const name = data?.data?.publicProfileWithRoninAddress?.name;
      if (name) {
        this.roninAddressNames.set(roninAddress, name);
        return name;
      }
    } catch (e) {
      console.log(e);
    }
    this.roninAddressNames.set(roninAddress, 'unknown');
    return 'unknown';
  }

}
