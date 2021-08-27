import { Injectable } from '@angular/core';
import { AuthService } from '../auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { FirestoreScholar, Scholar } from '../../_models/scholar';
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
import { User } from '../../_models/user';
import _, { isEmpty } from 'lodash';
import { DefaultSLP, SLP } from '../../_models/slp';
import { DefaultLeaderboardDetails } from '../../_models/leaderboard';
import { RoninNames } from '../user/helpers/ronin-names';
import { LeaderboardStats } from '../user/helpers/leaderboard-stats';
import { AccountAxies } from './helpers/account-axies';
import { SLPStats } from './helpers/slp-stats';
import { CoinGecko } from './helpers/coin-gecko';
import { Apollo } from 'apollo-angular';
import { defaultColors } from 'src/app/constants';

export interface TotalValues {
  managerTotal: number;
  total: number;
}

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
  private scholarSubjects: Record<string, BehaviorSubject<Scholar>> = {};
  private currentUser: BehaviorSubject<User> = new BehaviorSubject(null);
  groups: string[] = [];
  roninNames: RoninNames;
  _accountAxies: AccountAxies;

  constructor(
    private service: AuthService,
    private db: AngularFirestore,
    private apollo: Apollo,
    private http: HttpClient
  ) {
    this.roninNames = new RoninNames(apollo);
    this._accountAxies = new AccountAxies(apollo);
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
              this.updateAllStats(scholar);
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

  async updateSLP(scholar: Scholar): Promise<void> {
    // SLP Stats
    scholar.slp = await SLPStats.getSLPStats(this.http, scholar.roninAddress);
    this.scholarSubjects[scholar.id].next(scholar);
  }

  private async updateAllStats(scholar: Scholar): Promise<void> {
    // SLP Stats
    this.updateSLP(scholar);

    // leaderboard stats
    scholar.leaderboardDetails = await LeaderboardStats.getLeaderBoardStats(this.http, scholar.roninAddress);
    this.scholarSubjects[scholar.id].next(scholar);

    // account axies
    scholar.axies = await this._accountAxies.getAxies(scholar.roninAddress);
    this.scholarSubjects[scholar.id].next(scholar);
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

  currentColors(): number[] {
    return isEmpty(this.currentUser.getValue()?.colors) ? defaultColors: this.currentUser.getValue().colors;
  }


  currentGroupColors(): Record<string, string> {
    return isEmpty(this.currentUser.getValue()?.groupColors) ? {}: this.currentUser.getValue().groupColors;
  }

  refresh(): void {
    const scholars = this.scholars$.getValue() ?? [];
    scholars.forEach((scholar) => {
      this.updateAllStats(scholar);
    });
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

  private getScholarWithSLP(firestoreScholar: FirestoreScholar): Scholar {
    const slp = DefaultSLP();
    const leaderboardDetails = DefaultLeaderboardDetails();

    const scholar: Scholar = {
      ...firestoreScholar,
      leaderboardDetails,
      slp,
      axies: [],
      roninName: leaderboardDetails.name,
      scholarRoninName: 'unknown',
    };

    return scholar;
  }
}
