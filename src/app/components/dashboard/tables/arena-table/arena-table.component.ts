import { Component, Input, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { cloneDeep } from 'lodash';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { FirestoreScholar, Scholar } from 'src/app/_models/scholar';

interface TableData {
  name: string;
  draws: number;
  elo: number;
  loses: number;
  rank: number;
  wins: number;
  roninAddress: string;
}

@Component({
  selector: 'app-arena-table',
  templateUrl: './arena-table.component.html',
  styleUrls: ['./arena-table.component.scss']
})
export class ArenaTableComponent implements OnInit {
  displayedColumns: string[] = [
    'name',
    'rank',
    'elo',
    'wins',
    'draws',
    'loses',
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
        tableData.push({
          name: scholar?.name ?? 'unknown',
          rank: scholar?.leaderboardDetails?.rank,
          elo: scholar?.leaderboardDetails?.elo,
          wins: scholar?.leaderboardDetails?.wins,
          loses: scholar?.leaderboardDetails?.loses,
          draws: scholar?.leaderboardDetails?.draws,
          roninAddress: scholar?.roninAddress,
        });
      });
      this.dataSource = new MatTableDataSource(tableData);
      this.dataSource.sort = this.sort;
    });
    this.hideAddress$.subscribe((hideAddresses) => {
      this.hideAddresses = hideAddresses;
    });
  }

  navigateToScholar(element: TableData): void {
    debugger;
    window.open('https://marketplace.axieinfinity.com/profile/' + element.roninAddress + '/axie', '_blank');
  }
}
