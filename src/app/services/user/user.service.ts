import { Injectable } from '@angular/core';
import { AuthService } from '../auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { FirestoreScholar } from '../../_models/scholar';
import { BattleLogs } from '../../_models/battle';
import { HttpClient } from '@angular/common/http';
import {
  filter,
  map,
  pairwise,
  publishReplay,
  refCount,
  switchMap,
} from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';
import { DefaultUser, User } from '../../_models/user';
import _, { isEmpty, isEqual } from 'lodash';
import { DefaultSLP, SLP } from '../../_models/slp';
import { DefaultLeaderboardDetails, LeaderboardDetails } from '../../_models/leaderboard';
import { RoninNames } from '../user/helpers/ronin-names';
import { LeaderboardStats } from '../user/helpers/leaderboard-stats';
import { BattleInfo } from '../user/helpers/battle-logs';
import { AccountAxies } from './helpers/account-axies';
import { SLPStats } from './helpers/slp-stats';
import { CoinGecko } from './helpers/coin-gecko';
import { Apollo } from 'apollo-angular';
import { defaultColors, defaultManagerShare, defaultScholarShare } from 'src/app/constants';
import { Axie, AxieResult } from 'src/app/_models/axie';
import { Table } from 'src/app/_models/table';

export interface TotalValues {
  managerTotal: number;
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private firestoreScholars$: Record<string, BehaviorSubject<FirestoreScholar>> = {};
  private scholarSLP$: Record<string, BehaviorSubject<SLP>> = {};
  private scholarLeaderBoardDetails$: Record<string, BehaviorSubject<LeaderboardDetails>> = {};
  private scholarAxies$: Record<string, BehaviorSubject<AxieResult>> = {};
  hideAddress: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);


  private fiatSLPPrice$: BehaviorSubject<number>
    = new BehaviorSubject<number>(0);
  private fiatAXSPrice$: BehaviorSubject<number>
    = new BehaviorSubject<number>(0);
  private fiatCurrency$: BehaviorSubject<string>
    = new BehaviorSubject<string>('usd');

  private currentUser: BehaviorSubject<User> = new BehaviorSubject(null);
  groups: string[] = [];
  private _roninNames: RoninNames;
  private _accountAxies: AccountAxies;
  tableID: BehaviorSubject<string> = new BehaviorSubject(null);
  private currentUserID: string;
  ownTableName: BehaviorSubject<string> = new BehaviorSubject(null);
  ownLinkedTables: BehaviorSubject<Record<string, Table>> = new BehaviorSubject(null);

  constructor(
    private service: AuthService,
    private db: AngularFirestore,
    private apollo: Apollo,
    private http: HttpClient
  ) {
    this._roninNames = new RoninNames(apollo);
    this._accountAxies = new AccountAxies(apollo);
    this.tableID
      .pipe(
        filter((tableID) => !!tableID),
        switchMap((tableID) => {
          return this.db.collection('users').doc(tableID).valueChanges();
        })
      )
      .subscribe(async (user: User) => {
        this.setDefaults(user);
        const scholars = Object.values(
          user.scholars ?? {}
        ) as FirestoreScholar[];
        this.groups = [];
        const currency = user.currency ?? 'usd';
        this.fiatCurrency$.next(currency);
        this.setCurrency(currency);

        var oldKeys = Object.keys(this.firestoreScholars$);
        scholars.forEach((scholar) => {
          // add group to groups
          if (scholar.group && !this.groups.includes(scholar.group)) {
            this.groups.push(scholar.group);
          }

          // if there is a new scholar we want to update the current resources
          if (!this.firestoreScholars$[scholar.id]) {
            this.firestoreScholars$[scholar.id] = new BehaviorSubject(scholar);

            // update SLP subject
            var slp = DefaultSLP();
            this.scholarSLP$[scholar.id] = new BehaviorSubject(slp);
            this.updateSLP(scholar);

            // update leaderboard subject
            var leaderboardDetails = DefaultLeaderboardDetails();
            this.scholarLeaderBoardDetails$[scholar.id] = new BehaviorSubject(leaderboardDetails);
            this.updateLeaderBoardDetails(scholar);

            // update axies
            this.scholarAxies$[scholar.id] = new BehaviorSubject({
              hasError: false,
              axies: []
            });
            this.updateAxies(scholar);
          } else {
            const currentValue = this.firestoreScholars$[scholar.id].getValue();

            // ronin address has updated
            if (scholar?.roninAddress && currentValue?.roninAddress != scholar?.roninAddress) {
              this.updateSLP(scholar);
              this.updateLeaderBoardDetails(scholar);
              this.updateAxies(scholar);
            }

            if (!isEqual(scholar, currentValue)) {
              this.firestoreScholars$[scholar.id].next(scholar);
            }

            // remove current scholar from old key
            oldKeys = oldKeys.filter(item => item !== (scholar.id));
          }
        });

        // remove old values
        oldKeys.forEach((key) => {
          delete this.firestoreScholars$[key];
          delete this.scholarSLP$[key];
        });

        this.currentUser.next(user);
      });

      this.service.userState.pipe(
        filter((user) => !!user),
        switchMap((user) => {
          return fromPromise(this.ensureDocumentCreated(user));
        })).subscribe((user) => {
          this.currentUserID = user.uid;
          this.tableID.next(user.uid);
      });

      this.service.userState.pipe(
        filter((user) => !!user),
        switchMap((user) => {
          return this.db.collection('users').doc(user.uid).valueChanges();
        })
      ).subscribe((user: User) => {
        this.ownLinkedTables.next(user?.linkedTables ?? {});
        this.ownTableName.next(user?.title);
      });
  }

  setOwnTable(): void {
    this.tableID.next(this.currentUserID);
  }

  getCurrentUserID(): string {
    return this.currentUserID;
  }

  setTable(table: Table): void {
    this.tableID.next(table.tableID);
  }

  async updateRoninName(scholar: FirestoreScholar): Promise<string> {
    return this._roninNames.updateRoninName(scholar.roninAddress);
  }

  async updateScholarRoninName(scholar: FirestoreScholar): Promise<string> {
    return this._roninNames.updateRoninName(scholar.scholarRoninAddress);
  }

  getRoninName(roninAddress: string): string {
    return this._roninNames.getRoninName(roninAddress);
  }

  getScholar(scholarID: string):  Observable<FirestoreScholar> {
    return this.firestoreScholars$[scholarID]?.asObservable();
  }

  getScholarsSLP(scholarID: string): Observable<SLP> {
    return this.scholarSLP$[scholarID];
  }

  getScholarBattleLogs(roninAddress: string): Promise<BattleLogs> {
    return BattleInfo.getBattleLogs(this.http, roninAddress);
  }

  getScholarsLeaderboardDetails(scholarID: string): Observable<LeaderboardDetails> {
    return this.scholarLeaderBoardDetails$[scholarID];
  }

  getScholarsAxies(scholarID: string): Observable<AxieResult> {
    return this.scholarAxies$[scholarID];
  }

  async updateSLP(scholar: FirestoreScholar): Promise<void> {
    // SLP Stats
    const slp = await SLPStats.getSLPStats(this.http, scholar.roninAddress);
    this.scholarSLP$[scholar.id].next(slp);
  }


  async updateLeaderBoardDetails(scholar: FirestoreScholar): Promise<void> {
    // leaderboard stats
    const leaderboardDetails = await LeaderboardStats.getLeaderBoardStats(this.http, scholar.roninAddress);
    this.scholarLeaderBoardDetails$[scholar.id].next(leaderboardDetails);
  }

  async updateAxies(scholar: FirestoreScholar): Promise<void> {
    // account axies
    const result = await this._accountAxies.getAxies(scholar.roninAddress);
    this.scholarAxies$[scholar.id].next(result);
  }

  private async updateAllStats(scholar: FirestoreScholar): Promise<void> {
    this.updateSLP(scholar);
    this.updateLeaderBoardDetails(scholar);
    this.updateAxies(scholar);
  }

  async ensureDocumentCreated(user: any): Promise<any> {
    const userDocument = await this.db
      .collection('users')
      .doc(user.uid)
      .get()
      .toPromise();

    if (!userDocument || !userDocument.exists) {
      const user: User = DefaultUser();
      await userDocument.ref.set(
        user,
        { merge: true }
      );
    }
    return user;
  }

  // getScholar(scholarId: string): Observable<Scholar> {
  //   return this.scholarSubjects[scholarId].asObservable();
  // }

  currentUser$(): Observable<User> {
    return this.currentUser.asObservable();
  }

  currentColors(): number[] {
    return isEmpty(this.currentUser.getValue()?.colors) ? defaultColors: this.currentUser.getValue().colors;
  }


  currentGroupColors(): Record<string, string> {
    return isEmpty(this.currentUser.getValue()?.groupColors) ? {}: this.currentUser.getValue().groupColors;
  }

  refresh(): void {
    Object.values(this.firestoreScholars$).forEach((scholarSubject) => {
      this.updateAllStats(scholarSubject.getValue());
    })
  }

  setCurrency(currency: string): void {
    CoinGecko.pollSLPPrice(this.http, currency).then((price) => this.fiatSLPPrice$.next(price));
    CoinGecko.pollAXSPrice(this.http, currency).then((price) => this.fiatAXSPrice$.next(price));
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
  getScholars(): Observable<FirestoreScholar[]> {
    return this.currentUser.pipe(map((user) => Object.values(user?.scholars ?? {})));
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
      switchMap((scholars) => {
        let output: Observable<{slp: SLP, managerShare: number}>[] = [];
        scholars.forEach((scholar) => {
          output.push(this.getScholarsSLP(scholar.id).pipe(map((slp) => (
            {slp: slp, managerShare: this.getManagerShare(scholar)}))));
        });

        return combineLatest(output)}),
        map((output) => {
          let total = 0;
        let managerTotal = 0;
        output.forEach((data) => {
          const currentTotal = data?.slp?.inProgress ?? 0;
          total += currentTotal;
          managerTotal += currentTotal * (data?.managerShare / 100);
        });
        return {
          total,
          managerTotal,
        };
      })
    );
  }

  getTotalSLP(): Observable<TotalValues> {
    return this.getScholars().pipe(
      switchMap((scholars) => {
        let output: Observable<{slp: SLP, managerShare: number}>[] = [];
        scholars.forEach((scholar) => {
          output.push(this.getScholarsSLP(scholar.id).pipe(map((slp) => (
            {slp: slp, managerShare: this.getManagerShare(scholar)}))));
        });

        return combineLatest(output)}),
        map((output) => {

        let total = 0;
        let managerTotal = 0;
        output.forEach((data) => {
          const currentTotal = data?.slp?.total ?? 0;
          total += currentTotal;
          managerTotal += currentTotal * (data?.managerShare / 100);
        });
        return {
          total,
          managerTotal,
        };
      })
    );
  }

  getManagerShare(scholar: FirestoreScholar): number {
    if (!scholar) {
      return 100;
    }
    if (scholar.useOwnPayShare) {
      return scholar.managerShare;
    }
    const payShare = this.currentUser.getValue().defaults.payshare;
    const paidTimes = scholar.paidTimes;
    if (paidTimes > (payShare.length - 1)) {
      return payShare[payShare.length - 1].manager;
    }
    return payShare[paidTimes].manager;
  }

  getFiatCurrency(): Observable<string> {
    return this.fiatCurrency$.asObservable();
  }

  setDefaults(user: User) {
    if (_.isEmpty(user?.defaults?.payshare)) {
      if (!user.defaults) {
        user.defaults = {};
      }
      user.defaults.payshare = [{
        manager: defaultManagerShare,
        scholar: defaultScholarShare,
      }];
    }
  }
}


