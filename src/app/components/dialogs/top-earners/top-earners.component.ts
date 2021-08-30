import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap, withLatestFrom } from 'rxjs/operators';
import { UserService } from 'src/app/services/user/user.service';
import { LeaderboardDetails } from 'src/app/_models/leaderboard';
import { FirestoreScholar } from 'src/app/_models/scholar';
import { SLP } from 'src/app/_models/slp';


enum ViewMode {
  slp,
  elo,
}

class TableData {
  name: string;
  average: number;
  elo: number
}

@Component({
  selector: 'app-top-earners',
  templateUrl: './top-earners.component.html',
  styleUrls: ['./top-earners.component.scss']
})
export class TopEarnersComponent implements OnInit {
  scholars: TableData[] = [];
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
    ]).pipe(switchMap(([scholars, viewMode]) => {
      let output: Observable<TableData>[] = [];
        scholars.forEach((scholar) => {
          output.push(
            combineLatest([
              this.userService.getScholarsLeaderboardDetails(scholar.id),
              this.userService.getScholarsSLP(scholar.id),
            ]).pipe(
                map(([details, slp]) => {
                  const tableData: TableData = {
                    name: scholar.name,
                    average: this.getAverageSLP(slp),
                    elo: details?.elo ?? 0,
                  };
                  return tableData;
              })
              ),
            );
        });
        return combineLatest(output);
    }),
    withLatestFrom(this.viewMode$),
    )
    .subscribe(([tableData, viewMode]) => {
        this.scholars = tableData;
        if (viewMode === ViewMode.slp) {
          this.scholars.sort((a, b) => b.average - a.average);
        }
        if (viewMode === ViewMode.elo) {
          this.scholars.sort((a, b) => b.elo - a.elo);
        }
      });
    }

  convertToTableData(scholar: FirestoreScholar): Observable<LeaderboardDetails> {
    return this.userService.getScholarsLeaderboardDetails(scholar.id);
  }

  getAverageSLP(slp: SLP, dateNow: Date = new Date()): number {
    if (isNaN(slp?.inProgress)) {
      return 0;
    }
    const inProgressSLP = slp.inProgress;
    const dateClaimed: Date = new Date(slp.lastClaimed * 1000);

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
