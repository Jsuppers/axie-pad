import { Component, Input, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { FirestoreScholar, Scholar } from '../../_models/scholar';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
import { AuthService } from '../../services/auth.service';
import { cloneDeep } from 'lodash';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import firebase from 'firebase';
import { UserService } from '../../services/user.service';

interface TableData {
  name: string;
  notClaimableSLP: number;
  claimableSLP: number;
  averageSLPSinceLastClaimed: number;
  totalSLP: number;
  claimableDate: string;
  lastClaimedDate: string;
}

@Component({
  selector: 'app-earnings-table',
  templateUrl: './earnings-table.component.html',
  styleUrls: ['./earnings-table.component.scss']
})
export class EarningsTableComponent implements OnInit {
  displayedColumns: string[] = [
    'name',
    'averageSLPSinceLastClaimed',
    'notClaimableSLP',
    'claimableSLP',
    'totalSLP',
    'lastClaimedDate',
    'claimableDate',
  ];
  dataSource: MatTableDataSource<TableData>;
  @Input()
  hideAddress$: Observable<boolean>;
  hideAddresses: boolean;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    public dialog: MatDialog,
    private db: AngularFirestore,
    private authService: AuthService,
    private user: UserService,
    private snackBar: MatSnackBar,
  ) {
  }

  ngOnInit(): void {
    this.user.getScholars().subscribe((scholars) => {
      const tableData: TableData[] = [];
      scholars.forEach((scholar) => {
        const inProgressSLP = scholar?.slp?.total ? (scholar.slp.total - (scholar.slp?.claimable ?? 0)) : 0;
        tableData.push({
          claimableDate: this.getClaimableDate(scholar),
          notClaimableSLP: inProgressSLP,
          lastClaimedDate: this.getLastClaimedDate(scholar),
          claimableSLP: scholar?.slp?.claimable ?? 0,
          averageSLPSinceLastClaimed: this.getAverageSLP(scholar),
          totalSLP: scholar?.slp?.total ?? 0,
          name: scholar?.name ?? 'unknown',
        });
      });
      this.dataSource = new MatTableDataSource(tableData);
      this.dataSource.sort = this.sort;
    });
    this.hideAddress$.subscribe((hideAddresses) => {
      this.hideAddresses = hideAddresses;
    });
  }

  openSnackBar(message: string): void {
    this.snackBar.open(message + ' copied', undefined, { duration: 5000 });
  }

  getClaimableDate(element: Scholar): string {
    if (!element?.slp?.lastClaimed) {
      return 'unknown';
    }
    const dateFuture: any = new Date((element.slp.lastClaimed + (60 * 60 * 24 * 14)) * 1000);
    const dateNow: any = new Date();

    const seconds = Math.floor((dateFuture - (dateNow)) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const currentHours = (hours - (days * 24));
    let output = '';
    if (days > 0) {
      output = days + ' days, ';
    }
    if (currentHours > 0) {
      output = output + currentHours + ' hours';
    }
    if (output.length === 0) {
      const currentMinutes = (minutes - (hours * 60));
      if (currentMinutes > 0 ) {
        return currentMinutes.toFixed(0) + ' minutes';
      }
      output = 'now';
    }
    return output;
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

  getAverageSLP(scholar: Scholar): number {
    if (isNaN(scholar?.slp?.total) || isNaN(scholar?.slp?.claimable)) {
      return 0;
    }
    const inProgressSLP = scholar.slp.total - scholar.slp.claimable;
    const dateFuture: any = new Date();
    const dateNow: any = new Date(scholar.slp.lastClaimed * 1000);

    const seconds = Math.floor((dateFuture - dateNow) / 1000);
    return (inProgressSLP / seconds * 86400);
  }

  navigateToScholar(element: FirestoreScholar): void {
    window.open('https://marketplace.axieinfinity.com/profile/' + element.roninAddress.replace('ronin:', '0x') + '/axie', '_blank');
  }
}
