import { ChangeDetectorRef, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { FirestoreScholar, Scholar } from '../_models/scholar';
import { HttpClient } from '@angular/common/http';
import {
  distinctUntilChanged,
  filter,
  map,
  pairwise,
  publishReplay,
  refCount,
  switchMap,
} from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';
import { User } from '../_models/user';
import _, { isEmpty, isEqual } from 'lodash';
import { DefaultSLP } from '../_models/slp';
import { DefaultLeaderboardDetails } from '../_models/leaderboard';
import { Apollo, gql } from 'apollo-angular';
import { FirebaseApp } from '@angular/fire';

export interface TotalValues {
  managerTotal: number;
  total: number;
}

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
  providedIn: 'root',
})
export class UserService {
  private firestoreScholars$: BehaviorSubject<FirestoreScholar[]> =
    new BehaviorSubject<FirestoreScholar[]>([]);
  private scholars$: BehaviorSubject<Scholar[]> = new BehaviorSubject<
    Scholar[]
  >([]);
  private fiatSLPPrice$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private fiatAXSPrice$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private fiatCurrency$: BehaviorSubject<string> = new BehaviorSubject<string>(
    'usd'
  );
  private roninAddressNames: Map<string, string> = new Map<string, string>();
  private scholarSubjects: Record<string, BehaviorSubject<Scholar>> = {};
  private currentUser: BehaviorSubject<User> = new BehaviorSubject(null);
  groups: string[] = [];

  constructor(
    private service: AuthService,
    private db: AngularFirestore,
    private apollo: Apollo,
    private http: HttpClient
  ) {
    this.service.userState
      .pipe(
        filter((user) => !!user),
        switchMap((user) => {
          return fromPromise(this.ensureDocumentCreated(user));
        }),
        switchMap((user) => {
          return this.db.collection('users').doc(user.uid).valueChanges();
        })
      )
      .subscribe(async (user: User) => {
        const scholars = Object.values(
          user.scholars ?? {}
        ) as FirestoreScholar[];
        this.groups = [];
        const currency = user.currency ?? 'usd';
        this.fiatCurrency$.next(currency);
        this.setCurrency(currency);
        this.firestoreScholars$.next(scholars);
        this.currentUser.next(user);
      });

    this.firestoreScholars$
      .pipe(
        pairwise(),
        switchMap(([oldScholars, scholars]) => {
          const output: Observable<Scholar>[] = [];
          for (const firestoreScholar of scholars) {
            if (firestoreScholar.group && !this.groups.includes(firestoreScholar.group)) {
              this.groups.push(firestoreScholar.group);
            }
            const id = firestoreScholar.id;
            let scholar = this.getScholarWithSLP(firestoreScholar);
            if (!this.scholarSubjects[id]) {
              this.scholarSubjects[id] = new BehaviorSubject(scholar);
            }
            const oldScholar = oldScholars.find((value) => value.id === id);
            if (
              !oldScholar ||
              oldScholar.roninAddress !== firestoreScholar.roninAddress
            ) {
              this.updateScholar(scholar);
            } else {
              const currentScholar = this.scholarSubjects[id].getValue();
              currentScholar.managerShare = firestoreScholar.managerShare;
              currentScholar.paidTimes = firestoreScholar.paidTimes;
              currentScholar.name = firestoreScholar.name;
              currentScholar.group = firestoreScholar.group;
              this.scholarSubjects[id].next(currentScholar);
            }
            output.push(this.scholarSubjects[id].asObservable());
          }
          return combineLatest(output);
        }),
        // cached result of transformation
        publishReplay(),
        refCount()
      )
      .subscribe((scholars) => {
        this.scholars$.next(scholars);
      });
  }

  async ensureDocumentCreated(user: any): Promise<any> {
    const userDocument = await this.db
      .collection('users')
      .doc(user.uid)
      .get()
      .toPromise();

    if (!userDocument || !userDocument.exists) {
      await userDocument.ref.set(
        {
          scholars: {},
          currency: 'usd',
        },
        { merge: true }
      );
    }
    return user;
  }

  getScholar(scholarId: string): Observable<Scholar> {
    return this.scholarSubjects[scholarId].asObservable();
  }

  currentUser$(): Observable<User> {
    return this.currentUser.asObservable();
  }

  refresh(): void {
    const scholars = this.scholars$.getValue() ?? [];
    scholars.forEach((scholar) => {
      this.updateScholar(scholar);
    });
  }

  setCurrency(currency: string): void {
    this.pollSLPPrice(currency).then((price) => this.fiatSLPPrice$.next(price));
    this.pollAXSPrice(currency).then((price) => this.fiatAXSPrice$.next(price));
  }

  getSLPPrice(): Observable<number> {
    return this.fiatSLPPrice$.asObservable();
  }

  getTitle(): Observable<string> {
    return this.currentUser$().pipe(map((user) => user?.title));
  }

  getAXSPrice(): Observable<number> {
    return this.fiatAXSPrice$.asObservable();
  }

  // Sort the scholars
  getScholars(): Observable<Scholar[]> {
    return this.scholars$.asObservable();
  }

  getTotalSLP(): Observable<TotalValues> {
    return this.getScholars().pipe(
      map((scholars) => {
        let total = 0;
        let managerTotal = 0;
        scholars.forEach((scholar) => {
          const currentTotal = scholar?.slp?.total ?? 0;
          total += currentTotal;
          managerTotal += currentTotal * (scholar.managerShare / 100);
        });
        return {
          total,
          managerTotal,
        };
      })
    );
  }

  getTotalFiat(): Observable<TotalValues> {
    return combineLatest([this.getTotalSLP(), this.fiatSLPPrice$]).pipe(
      map(([total, fiatPrice]) => {
        return {
          total: total.total * fiatPrice,
          managerTotal: total.managerTotal * fiatPrice,
        };
      })
    );
  }

  getInprogressFiat(): Observable<TotalValues> {
    return combineLatest([this.getInProgressSLP(), this.fiatSLPPrice$]).pipe(
      map(([total, fiatPrice]) => {
        return {
          total: total.total * fiatPrice,
          managerTotal: total.managerTotal * fiatPrice,
        };
      })
    );
  }

  getInProgressSLP(): Observable<TotalValues> {
    return this.getScholars().pipe(
      map((scholars) => {
        let total = 0;
        let managerTotal = 0;
        scholars.forEach((scholar) => {
          const currentTotal = scholar?.slp?.inProgress ?? 0;
          total += currentTotal;
          managerTotal += currentTotal * (scholar.managerShare / 100);
        });
        return {
          total,
          managerTotal,
        };
      })
    );
  }

  getFiatCurrency(): Observable<string> {
    return this.fiatCurrency$.asObservable();
  }

  async pollSLPPrice(fiatCurrency: string): Promise<number> {
    const slpAddress = '0xcc8fa225d80b9c7d42f96e9570156c65d6caaa25';
    return this.pollPrice(fiatCurrency, slpAddress);
  }

  async pollAXSPrice(fiatCurrency: string): Promise<number> {
    const axsAddress = '0xbb0e17ef65f82ab018d8edd776e8dd940327b28b';
    return this.pollPrice(fiatCurrency, axsAddress);
  }

  async pollPrice(fiatCurrency: string, ethAddress: string): Promise<number> {
    try {
      const api =
        'https://api.coingecko.com/api/v3/simple/token_price/ethereum';
      const url =
        api +
        '?contract_addresses=' +
        ethAddress +
        '&vs_currencies=' +
        fiatCurrency;
      const output = await this.http.get<any>(url).toPromise();
      return output[ethAddress][fiatCurrency];
    } catch (e) {
      return 0;
    }
  }

  private getScholarWithSLP(firestoreScholar: FirestoreScholar): Scholar {
    const slp = DefaultSLP();
    const leaderboardDetails = DefaultLeaderboardDetails();

    const scholar: Scholar = {
      ...firestoreScholar,
      leaderboardDetails,
      slp,
      roninName: leaderboardDetails.name,
      scholarRoninName: 'unknown',
    };

    return scholar;
  }

  private updateScholar(scholar: Scholar): void {
    this.updateLeaderBoardDetails(scholar);
    this.updateSLP(scholar);
  }

  // Example request
  // https://api.lunaciarover.com/stats/
  //   {
  //     "ronin_address": "0x509ef...e1513",
  //     "updated_on": 1626899497,
  //     "last_claim_amount": 134,
  //     "last_claim_timestamp": 1626333108,
  //     "ronin_slp": 4330,
  //     "total_slp": 4534,
  //     "in_game_slp": 204,
  //     "slp_success": true,
  //     "ign": null,
  //     "rank": 0,
  //     "mmr": 0,
  //     "total_matches": 0,
  //     "win_rate": 0,
  //     "game_stats_success": false,
  // }
  private async updateSLP(scholar: Scholar): Promise<void> {
    if (scholar.roninAddress) {
      try {
        // TODO poll again every x seconds
        const url =
          'https://api.lunaciarover.com/stats/' + scholar.roninAddress.replace('ronin:', '0x');
        this.http
          .get<any>(url)
          .toPromise()
          .then((output) => {
            scholar.slp.claimable = output?.total_slp ?? 0;
            scholar.slp.total = output?.total_slp ?? 0;
            scholar.slp.inProgress = output?.in_game_slp ?? 0;
            scholar.slp.inWallet = output?.ronin_slp ?? 0;
            scholar.slp.lastClaimed = output?.last_claim_timestamp ?? 0;
            this.scholarSubjects[scholar.id].next(scholar);
          });
      } catch (e) {
        console.log(e);
      }
    }
  }

  // Example request
  // TODO use the request above
  private updateLeaderBoardDetails(scholar: Scholar): void {
    return;

    if (scholar.roninAddress) {
      const url = '';
      try {
        // TODO poll again every x seconds
        this.http
          .get<any>(url)
          .toPromise()
          .then((output) => {
            if (!isEmpty(output.items)) {
              scholar.leaderboardDetails.name = output.items[0].name;
              scholar.leaderboardDetails.elo = output.items[0].elo;
              scholar.leaderboardDetails.rank = output.items[0].rank;
              scholar.leaderboardDetails.wins = output.items[0].win_total;
              scholar.leaderboardDetails.draws = output.items[0].draw_total;
              scholar.leaderboardDetails.loses = output.items[0].lose_total;
              this.scholarSubjects[scholar.id].next(scholar);
            }
          });
      } catch (e) {
        console.log(e);
      }
    }
  }

  async getScholarRoninName(scholar: Scholar): Promise<void> {
    return this._getRoninName(
      scholar,
      'scholarRoninAddress',
      'scholarRoninName'
    );
  }

  async getRoninName(scholar: Scholar): Promise<void> {
    return this._getRoninName(scholar, 'roninAddress', 'roninName');
  }

  /**
   * TODO batch requests
   * @param roninAddress
   * @private
   */
  private async _getRoninName(
    scholar: Scholar,
    addressField: string,
    nameField: string
  ): Promise<void> {
    const address = scholar[addressField];
    let name = 'unknown';
    if (!address) {
      return;
    }
    if (this.roninAddressNames.has(address)) {
      name = this.roninAddressNames.get(address);
    } else if (address.length === 0) {
      name = '';
    } else {
      try {
        const data: any = await this.apollo
          .query({
            query: GET_PROFILE_NAME_BY_RONIN_ADDRESS,
            variables: {
              roninAddress: address.replace('ronin:', '0x'),
            },
          })
          .toPromise();

        const profileName = data?.data?.publicProfileWithRoninAddress?.name;
        if (profileName) {
          name = profileName;
        }
      } catch (e) {
        console.log(e);
      }
      this.roninAddressNames.set(address, name);
    }
    scholar[nameField] = name;
  }
}
