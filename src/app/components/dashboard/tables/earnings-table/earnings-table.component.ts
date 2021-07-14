import { Component, Input, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { combineLatest, Observable } from 'rxjs';
import { FirestoreScholar, Scholar } from '../../../../_models/scholar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../../services/user.service';
import { map, switchMap } from 'rxjs/operators';
import { DialogService } from 'src/app/services/dialog.service';

interface TableData {
  position: number;
  name: string;
  roninName: string;
  roninAddress: string;
  averageSLPSinceLastClaimed: number;
  averageChipColor: string;
  inProgressSLP: number;
  managersShareSLP: number;
  managersSharePercentage: number;
  claimableSLP: number;
  totalSLP: number;
  claimableDate: string;
  claimableTime: string;
  lastClaimedDate: string;
  paidTimes: number;
  scholar: Scholar;
}

@Component({
  selector: 'app-earnings-table',
  templateUrl: './earnings-table.component.html',
  styleUrls: ['./earnings-table.component.scss']
})
export class EarningsTableComponent implements OnInit {
  displayedColumns: string[] = [
    'position',
    'name',
    'roninAddress',
    'averageSLPSinceLastClaimed',
    'inProgressSLP',
    'managersShareSLP',
    'claimableSLP',
    'totalSLP',
    'paidTimes',
    'lastClaimedDate',
    'claimableDate',
    'actions',
    'menu',
  ];
  dataSource: MatTableDataSource<TableData>;
  @Input()
  hideAddress$: Observable<boolean>;
  hideAddresses: boolean;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    public dialog: MatDialog,
    private user: UserService,
    private snackBar: MatSnackBar,
    private sholarService: DialogService,
  ) {
  }

  ngOnInit(): void {
    this.user.getScholars().pipe(
      map((scholars) => {
      return (scholars ?? []).sort((a, b) => b?.slp?.inProgress - a?.slp?.inProgress)
    })).pipe(switchMap((scholars) => {
      const output: Observable<Scholar>[] = [];
      scholars.forEach((scholar) => {
        output.push(this.user.getScholar(scholar.id));
      });
      return combineLatest(output);

    })).subscribe((scholars) => {
      const tableData: TableData[] = [];
      scholars.forEach((scholar, index) => {
        const inProgress = scholar?.slp?.inProgress ?? 0;
        const averageSLP = this.getAverageSLP(scholar);
        tableData.push({
          scholar: scholar,
          position: index + 1,
          roninName: scholar?.roninName ?? 'unknown',
          paidTimes: scholar?.paidTimes ?? 0,
          roninAddress: scholar?.roninAddress,
          inProgressSLP: scholar?.slp?.inProgress ?? 0,
          managersShareSLP: inProgress * ((scholar?.managerShare ?? 0) / 100),
          managersSharePercentage: (scholar?.managerShare ?? 0),
          claimableDate: this.getClaimableDateString(scholar),
          claimableTime: this.getClaimableTimeString(scholar),
          lastClaimedDate: this.getLastClaimedDate(scholar),
          claimableSLP: scholar?.slp?.claimable ?? 0,
          averageSLPSinceLastClaimed: averageSLP,
          averageChipColor: this.getAverageChipColor(averageSLP),
          totalSLP: scholar?.slp?.total ?? 0,
          name: scholar?.name ?? 'unknown',
        });
      });
      this.dataSource = new MatTableDataSource(tableData);
      this.dataSource.sortingDataAccessor = (item, property) => {
        switch(property) {
          case 'claimableDate': return item.scholar.slp.lastClaimed;
          case 'lastClaimedDate': return item.scholar.slp.lastClaimed;
          default: return item[property];
        }
      };
      this.dataSource.sort = this.sort;
    });
    this.hideAddress$.subscribe((hideAddresses) => {
      this.hideAddresses = hideAddresses;
    });
  }

  openSnackBar(message: string): void {
    this.snackBar.open(message + ' copied', undefined, { duration: 5000 , verticalPosition: 'top'});
  }

  getClaimableDateString(element: Scholar): string {
    if (!element?.slp?.lastClaimed) {
      return 'unknown';
    }
    const dateFuture: any = new Date((element.slp.lastClaimed + (60 * 60 * 24 * 14)) * 1000);
    const dateNow: any = new Date();
    if (dateFuture < dateNow) {
      return 'now';
    }

    const seconds = Math.floor((dateFuture - (dateNow)) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let output = '';
    if (days >= 0) {
      output = days + ' days';
    }
    return output;
  }

  getClaimableTimeString(element: Scholar): string {
    if (!element?.slp?.lastClaimed) {
      return 'unknown';
    }
    const claimableDate: any = new Date((element.slp.lastClaimed + (60 * 60 * 24 * 14)) * 1000);
    const now: any = new Date();
    if (claimableDate < now) {
      return '';
    }

    return claimableDate.toLocaleTimeString();
  }

  getLastClaimedDate(element: Scholar): string {
    if (!element?.slp?.lastClaimed) {
      return 'unknown';
    }
    const dateFuture: any = new Date();
    const dateNow: any = new Date(element.slp.lastClaimed * 1000);

    const seconds = Math.floor((dateFuture - (dateNow)) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const currentHours = (hours - (days * 24));
    if (days > 0) {
      return days + ' days';
    }
    if (currentHours > 0) {
      return currentHours + ' hours';
    }
    return 'just now';
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

  getAverageChipColor(averageSLP: number): string {
    if (Math.round(averageSLP) < 100) {
      return '#FF0000'; // red
    }
    if (Math.round(averageSLP) < 150) {
      return '#FF8000'; // orange
    }
    if (Math.round(averageSLP) < 200) {
      return '#00CC00'; // green
    }
    return '#FF00FF'; // pink
  }

  openPaidDialog(data: TableData): void {
    this.sholarService.openPayDialog({
      ...data.scholar,
    });
  }

  openDialog(data: TableData): void {
    this.sholarService.openDialog({
      ...data.scholar,
    });
  }

  deleteScholar(data: TableData): void {
    this.sholarService.deleteScholar(data.scholar.id);
  }

  navigateToScholar(roninAddress: string) {
    this.sholarService.navigateToScholar(roninAddress);
  }
}
