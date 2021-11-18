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
import moment from 'moment';

type Scholar = Partial<
  TableEarningsData &
    TableArenaData & {
      email: string;
      axies: Axie[];
      scholarRoninAddress: string;
      scholarShareSLP: number;
      scholarSharePercentage: number;
      averageSlp: number;
      averageManagerUsd: number;
      averageScholarUsd: number;
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

        const averageDailySLP = this.getAverageSLP(slp);
        const averageDailyUSD = averageDailySLP * slpPrice;
        const managerShare = this.user.getManagerShare(scholar) ?? 0;
        const managerPercentageShare = managerShare / 100;
        this.scholar = {
          id: scholar.id,
          scholar: scholar,
          email: scholar?.email,
          roninName: this.user.getRoninName(scholar.roninAddress),
          paidTimes: scholar?.paidTimes ?? 0,
          roninAddress: scholar?.roninAddress,
          scholarRoninAddress: scholar?.scholarRoninAddress,
          inProgressSLP: inProgress,
          managersShareSLP: inProgress * managerPercentageShare,
          managersSharePercentage: managerShare,
          scholarShareSLP: inProgress * ((100 - managerShare) / 100),
          scholarSharePercentage: 100 - managerShare,
          totalSLP: slp?.total ?? 0,
          slp: slp,
          rank: leaderboardDetails.rank,
          elo: leaderboardDetails.elo,
          wins: leaderboardDetails.wins,
          loses: leaderboardDetails.loses,
          draws: leaderboardDetails.draws,
          axies: axies.axies.slice(0, 3),
          averageSlp: averageDailySLP,
          averageManagerUsd: averageDailyUSD * managerPercentageShare,
          averageScholarUsd: averageDailyUSD * (1 - managerPercentageShare),
          winRate: Number.isNaN(winRate) ? 0 : winRate,
          group: scholar.group,
        };

        this.fiatCurrency = getSymbolFromCurrency(currency);

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
    return moment.utc(element.timestamp).fromNow();
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

  getTeamColor(groupName: string) {
    const color = this.user.currentGroupColors()[groupName];
    if (color) {
      return '#' + color;
    }
  }
}
