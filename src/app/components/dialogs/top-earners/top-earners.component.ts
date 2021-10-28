import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap, withLatestFrom } from 'rxjs/operators';
import { UserService } from 'src/app/services/user/user.service';
import { SLP } from 'src/app/_models/slp';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

enum ViewMode {
  slp,
  elo,
}

class TableData {
  name: string;
  averageSLP: number;
  averageUSD: number;
  elo: number;
  winRate: number;
}

@Component({
  selector: 'app-top-earners',
  templateUrl: './top-earners.component.html',
  styleUrls: ['./top-earners.component.scss'],
})
export class TopEarnersComponent implements OnInit {
  scholars: TableData[] = [];
  viewMode$ = new BehaviorSubject<ViewMode>(ViewMode.slp);
  viewMode = ViewMode;

  pageEvent: PageEvent;
  dataSource = new MatTableDataSource<TableData>([]);
  displayedColumns = [];

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    public dialogRef: MatDialogRef<TopEarnersComponent>,
    private userService: UserService
  ) {}

  async ngOnInit(): Promise<void> {
    combineLatest([
      this.userService.getScholars(),
      this.viewMode$,
      this.userService.getSLPPrice(),
    ])
      .pipe(
        switchMap(([scholars, viewMode, slpPrice]) => {
          let output: Observable<TableData>[] = [];
          scholars.forEach((scholar) => {
            output.push(
              combineLatest([
                this.userService.getScholarsLeaderboardDetails(scholar.id),
                this.userService.getScholarsSLP(scholar.id),
              ]).pipe(
                map(([details, slp]) => {
                  const winRate =
                    (details.wins /
                      (details.wins + details.loses + details.draws)) *
                    100;
                  const averageSLP = this.getAverageSLP(slp);
                  const averageUSD = averageSLP * slpPrice;

                  const tableData: TableData = {
                    name: scholar.name,
                    averageSLP,
                    averageUSD,
                    elo: details?.elo ?? 0,
                    winRate: isNaN(winRate) ? 0 : winRate,
                  };
                  return tableData;
                })
              )
            );
          });
          return combineLatest(output);
        }),
        withLatestFrom(this.viewMode$)
      )
      .subscribe(([tableData, viewMode]) => {
        if (viewMode === ViewMode.slp) {
          this.displayedColumns = ['name', 'averageSLP', 'averageUSD'];
          this.dataSource.data = tableData.sort(
            (a, b) => b.averageSLP - a.averageSLP
          );
        }
        if (viewMode === ViewMode.elo) {
          this.displayedColumns = ['name', 'elo', 'winRate'];
          this.dataSource.data = tableData.sort((a, b) => b.elo - a.elo);
        }
      });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
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

  close(): void {
    this.dialogRef.close();
  }

  sortScholars(): void {
    this.dataSource.data = this.dataSource.data.reverse();
  }

  onTabChange(index: number) {
    if (index === 0) {
      this.viewMode$.next(ViewMode.slp);
    } else {
      this.viewMode$.next(ViewMode.elo);
    }
  }

  getAverageChipColor(averageSLP: number): string {
    const colors = this.userService.currentColors();
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
