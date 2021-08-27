import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { UserService } from 'src/app/services/user/user.service';
import { Scholar } from 'src/app/_models/scholar';


enum ViewMode {
  slp,
  elo,
}

@Component({
  selector: 'app-top-earners',
  templateUrl: './top-earners.component.html',
  styleUrls: ['./top-earners.component.scss']
})
export class TopEarnersComponent implements OnInit {
  scholars: {name: string, average: number, elo: number}[] = [];
  viewMode$ = new BehaviorSubject<ViewMode>(ViewMode.slp);
  viewMode = ViewMode;

  constructor(
    public dialogRef: MatDialogRef<TopEarnersComponent>,
    private userService: UserService,
  ) { }


    async ngOnInit(): Promise<void> {
      combineLatest([
      this.userService.getScholars(),
      this.viewMode$,
    ]).subscribe(([scholars, viewMode]) => {
        this.scholars = [];
        scholars.forEach((scholar) => {
          this.scholars.push({
            name: scholar.name,
            average: this.getAverageSLP(scholar) ?? 0,
            elo: scholar?.leaderboardDetails?.elo ?? 0,
          })
        });
        if (viewMode === ViewMode.slp) {
          this.scholars.sort((a, b) => b.average - a.average);
        }
        if (viewMode === ViewMode.elo) {
          this.scholars.sort((a, b) => b.elo - a.elo);
        }
      });
    }


  getAverageSLP(scholar: Scholar, dateNow: Date = new Date()): number {
    if (isNaN(scholar?.slp?.inProgress)) {
      return 0;
    }
    const inProgressSLP = scholar.slp.inProgress;
    const dateClaimed: Date = new Date(scholar.slp.lastClaimed * 1000);

    const seconds = Math.floor((dateNow.getTime() - dateClaimed.getTime()) / 1000);
    const secondsInDay = 86400;
    if (seconds < secondsInDay) {
      return inProgressSLP;
    }
    return (inProgressSLP / seconds * secondsInDay);
  }

  close(): void {
    this.dialogRef.close();
  }

  sortScholars(): void {
    this.scholars.reverse();
  }

  showElo() {
    this.viewMode$.next(ViewMode.elo);
  }

  showSLP() {
    this.viewMode$.next(ViewMode.slp);
  }
}
