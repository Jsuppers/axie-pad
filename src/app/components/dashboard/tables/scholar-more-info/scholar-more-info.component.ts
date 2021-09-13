import { Component, Input, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { DialogService } from 'src/app/services/dialog.service';
import { UserService } from 'src/app/services/user/user.service';
import { Battle, BattleLogs } from 'src/app/_models/battle';
import { PaymentMethods } from 'src/app/_models/scholar';
import { TableArenaData } from '../arena-table/arena-table.component';
import { TableEarningsData } from '../earnings-table/earnings-table.component';

@Component({
  selector: 'app-scholar-more-info',
  templateUrl: './scholar-more-info.component.html',
  styleUrls: ['./scholar-more-info.component.scss'],
})
export class ScholarMoreInfoComponent implements OnInit {
  @Input()
  scholarId: string;
  scholar: Partial<TableEarningsData & TableArenaData>;
  paymentMethods = PaymentMethods;
  roninName: string;
  scholarRoninName: string;
  battleLogs: BattleLogs;
  loading = false;

  constructor(
    private user: UserService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.user.getScholar(this.scholarId),
      this.user.getScholarsSLP(this.scholarId),
      this.user.getScholarsLeaderboardDetails(this.scholarId),
    ]).subscribe(([scholar, slp, leaderboardDetails]) => {
      const inProgress = slp?.inProgress ?? 0;

      this.scholar = {
        id: scholar.id,
        scholar: scholar,
        roninName: this.user.getRoninName(scholar.roninAddress),
        paidTimes: scholar?.paidTimes ?? 0,
        roninAddress: scholar?.roninAddress,
        inProgressSLP: inProgress,
        managersShareSLP: inProgress * ((this.user.getManagerShare(scholar) ?? 0) / 100),
        managersSharePercentage: this.user.getManagerShare(scholar) ?? 0,
        totalSLP: slp?.total ?? 0,
        slp: slp,
        rank: leaderboardDetails.rank,
        elo: leaderboardDetails.elo,
        wins: leaderboardDetails.wins,
        loses: leaderboardDetails.loses,
        draws: leaderboardDetails.draws,
      };

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
    });
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
    this.user.getScholarBattleLogs(this.scholar.roninAddress).then((battleLogs) => {
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
    window.open(
      'axie://?f=rpl&q=' +
        element.battleUuid,
      '_blank'
    );
  }
}
