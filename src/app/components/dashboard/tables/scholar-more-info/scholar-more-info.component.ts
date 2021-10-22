import { Component, Input, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import getSymbolFromCurrency from 'currency-symbol-map';
import { combineLatest } from 'rxjs';
import { DialogService } from 'src/app/services/dialog.service';
import { UserService } from 'src/app/services/user/user.service';
import { Axie } from 'src/app/_models/axie';
import { Battle, BattleLogs } from 'src/app/_models/battle';
import { PaymentMethods } from 'src/app/_models/scholar';
import { SLP } from 'src/app/_models/slp';
import { TableArenaData } from '../arena-table/arena-table.component';
import { TableEarningsData } from '../earnings-table/earnings-table.component';

type Scholar = Partial<
  TableEarningsData &
    TableArenaData & {
      email: string;
      axies: Axie[];
      scholarShareSLP: number;
      scholarSharePercentage: number;
      averageSlp: number;
      averageUsd: number;
      winRate: number;
    }
>;

@Component({
  selector: 'app-scholar-more-info',
  templateUrl: './scholar-more-info.component.html',
  styleUrls: ['./scholar-more-info.component.scss'],
})
export class ScholarMoreInfoComponent implements OnInit {
  @Input()
  scholarId: string;
  scholar: Scholar;
  paymentMethods = PaymentMethods;
  roninName: string;
  scholarRoninName: string;
  battleLogs: BattleLogs;
  loading = false;
  fiatCurrency: string;

  constructor(
    private user: UserService,
    private dialogService: DialogService,
    private db: AngularFirestore
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.user.getScholar(this.scholarId),
      this.user.getScholarsSLP(this.scholarId),
      this.user.getScholarsLeaderboardDetails(this.scholarId),
      this.user.getScholarsAxies(this.scholarId),
      this.user.getSLPPrice(),
      this.user.getFiatCurrency(),
    ]).subscribe(
      ([scholar, slp, leaderboardDetails, axies, slpPrice, currency]) => {
        const inProgress = slp?.inProgress ?? 0;
        const winRate =
          (leaderboardDetails.wins /
            (leaderboardDetails.wins +
              leaderboardDetails.loses +
              leaderboardDetails.draws)) *
          100;

        this.scholar = {
          id: scholar.id,
          scholar: scholar,
          email: scholar?.email,
          roninName: this.user.getRoninName(scholar.roninAddress),
          paidTimes: scholar?.paidTimes ?? 0,
          roninAddress: scholar?.roninAddress,
          inProgressSLP: inProgress,
          managersShareSLP:
            inProgress * ((this.user.getManagerShare(scholar) ?? 0) / 100),
          managersSharePercentage: this.user.getManagerShare(scholar) ?? 0,
          scholarShareSLP:
            inProgress *
            ((100 - this.user.getManagerShare(scholar) ?? 0) / 100),
          scholarSharePercentage: 100 - this.user.getManagerShare(scholar) ?? 0,
          totalSLP: slp?.total ?? 0,
          slp: slp,
          rank: leaderboardDetails.rank,
          elo: leaderboardDetails.elo,
          wins: leaderboardDetails.wins,
          loses: leaderboardDetails.loses,
          draws: leaderboardDetails.draws,
          axies: axies.axies.slice(0, 3),
          averageSlp: this.getAverageSLP(slp),
          averageUsd: this.getAverageSLP(slp) * slpPrice,
          winRate: Number.isNaN(winRate) ? 0 : winRate,
        };

        this.fiatCurrency = getSymbolFromCurrency(currency);

        console.log(this.scholar);

        const roninName = this.user.getRoninName(
          this.scholar.scholar.roninAddress
        );

        if (!roninName || roninName === 'unknown') {
          this.user
            .updateRoninName(this.scholar.scholar)
            .then((roninName) => (this.roninName = roninName));
        }

        const scholarRoninName = this.user.getRoninName(
          this.scholar.scholar.scholarRoninAddress
        );

        if (!scholarRoninName || scholarRoninName === 'unknown') {
          this.user
            .updateScholarRoninName(this.scholar.scholar)
            .then((roninName) => (this.scholarRoninName = roninName));
        }
      }
    );
  }

  openSnackBar(message: string): void {
    this.dialogService.openSnackBar(message);
  }

  getLastClaimDate(): string {
    return new Date(this.scholar.slp.lastClaimed * 1000).toLocaleString();
  }

  getNextClaimDate(): string {
    return new Date(
      (this.scholar.slp.lastClaimed + 60 * 60 * 24 * 14) * 1000
    ).toLocaleString();
  }

  getBattleInfo(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.user
      .getScholarBattleLogs(this.scholar.roninAddress)
      .then((battleLogs) => {
        this.battleLogs = battleLogs;
        this.loading = false;
      });
  }

  getPlayedTime(element: Battle): string {
    var currentTime = Date.now();
    var playedTime = new Date(element.timestamp)?.getTime();
    var hours = Math.abs(currentTime - playedTime) / 36e5;
    return hours.toPrecision(2) + ' hours ago';
  }

  navigateToScholarReplay(element: Battle): void {
    window.open('axie://?f=rpl&q=' + element.battleUuid, '_blank');
  }

  async onNoteSave() {
    const uid = this.user.tableID.getValue();
    const scholarID = this.scholar.scholar?.id;
    if (uid && scholarID) {
      const note = this.scholar.scholar.note ?? '';
      const userDocument = await this.db
        .collection('users')
        .doc(uid)
        .get()
        .toPromise();
      await userDocument.ref.update({
        ['scholars.' + scholarID + '.note']: note,
      });
    }
  }

  getAverageSLP(slp: SLP, dateNow: Date = new Date()): number {
    if (isNaN(slp?.inProgress)) {
      return 0;
    }
    const inProgressSLP = slp.inProgress;
    const dateClaimed: Date = new Date(slp.lastClaimed * 1000);

    const seconds = Math.floor(
      (dateNow.getTime() - dateClaimed.getTime()) / 1000
    );
    const secondsInDay = 86400;
    if (seconds < secondsInDay) {
      return inProgressSLP;
    }
    return (inProgressSLP / seconds) * secondsInDay;
  }

  getAverageChipColor(averageSLP: number): string {
    const colors = this.user.currentColors();
    if (Math.round(averageSLP) < colors[0]) {
      return '#FF0000'; // red
    }
    if (Math.round(averageSLP) < colors[1]) {
      return '#FF8000'; // orange
    }
    if (Math.round(averageSLP) < colors[2]) {
      return '#00CC00'; // green
    }
    return '#FF00FF'; // pink
  }
}
