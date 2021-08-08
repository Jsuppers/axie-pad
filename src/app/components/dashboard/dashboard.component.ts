import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { DefaultFirestoreScholar, FirestoreScholar, Scholar } from '../../_models/scholar';
import firebase from 'firebase';
import { UserService } from '../../services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { CurrencyDialogComponent } from '../dialogs/currency-dialog/currency-dialog.component';
import getSymbolFromCurrency from 'currency-symbol-map';
import { DialogService } from 'src/app/services/dialog.service';
import { TopEarnersComponent } from '../dialogs/top-earners/top-earners.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  authService: AuthService;
  userDocument: firebase.firestore.DocumentSnapshot<unknown>;
  scholars: {name: string, average: number}[] = [];
  leaderBoardEmojis: string[] = ['🥇', '🥈', '🥉'];

  totalSLP: number;
  totalFiat: number;
  totalManagerSLP: number;
  totalManagerFiat: number;

  progressSLP: number;
  progressFiat: number;
  progressManagerSLP: number;
  progressManagerFiat: number;

  SLPPrice: number;
  AXSPrice: number;
  fiatCurrency: string;
  hideAddress: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private service: AuthService,
              private scholarService: DialogService,
              public dialog: MatDialog,
              private userService: UserService,
  ) {
    this.authService = service;
  }

  async ngOnInit(): Promise<void> {
    this.userService.getScholars().subscribe((scholars) => {
      this.scholars = [];
      scholars.forEach((scholar) => {
        this.scholars.push({
          name: scholar.name,
          average: this.getAverageSLP(scholar) ?? 0,
        })
      });
      this.scholars.sort((a, b) => b.average - a.average);
    });
    this.userService.getTotalSLP().subscribe((totalSLP) => {
      this.totalSLP = totalSLP.total;
      this.totalManagerSLP = totalSLP.managerTotal;
    });
    this.userService.getTotalFiat().subscribe((fiatTotal) => {
      this.totalFiat = fiatTotal.total;
      this.totalManagerFiat = fiatTotal.managerTotal;
    } );
    this.userService.getInProgressSLP().subscribe((totalSLP) => {
      this.progressSLP = totalSLP.total;
      this.progressManagerSLP = totalSLP.managerTotal;
    });
    this.userService.getInprogressFiat().subscribe((fiatTotal) => {
      this.progressFiat = fiatTotal.total;
      this.progressManagerFiat = fiatTotal.managerTotal;
    } );
    this.userService.getFiatCurrency().subscribe((currency) => {
      this.fiatCurrency = getSymbolFromCurrency(currency);
    });
  }

  addNewScholar(): void {
    const newScholar = DefaultFirestoreScholar();
    this.scholarService.openDialog(newScholar);
  }

  hideAddresses(): void {
    this.hideAddress.next(!this.hideAddress.getValue());
  }

  refresh(): void {
    this.userService.refresh();
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

  openTopEarnerDialog(): void {
    const dialogRef = this.dialog.open(TopEarnersComponent, {
      width: '400px',
    });
  }

}
