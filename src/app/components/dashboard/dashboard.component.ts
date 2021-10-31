import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { DefaultFirestoreScholar, FirestoreScholar } from '../../_models/scholar';
import firebase from 'firebase';
import { UserService } from '../../services/user/user.service';
import { MatDialog } from '@angular/material/dialog';
import getSymbolFromCurrency from 'currency-symbol-map';
import { DialogService } from 'src/app/services/dialog.service';
import { TopEarnersComponent } from '../dialogs/top-earners/top-earners.component';
import { SLP } from 'src/app/_models/slp';
import { map, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { PayShareDialogComponent } from '../dialogs/pay-share-dialog/pay-share-dialog.component';
import { AngularFirestore } from '@angular/fire/firestore';
import { PayShare } from 'src/app/_models/pay-share';
import { FormBuilder } from '@angular/forms';
import { AverageColorDialogComponent } from '../dialogs/average-color-dialog/average-color-dialog.component';

class TopEarningData {
  name: string;
  average: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  authService: AuthService;
  userDocument: firebase.firestore.DocumentSnapshot<unknown>;
  scholars: TopEarningData[] = [];
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
  hideAddress: BehaviorSubject<boolean>;

  tableSlpError = false;
  tableArenaError = false;
  tableAxiesError = false;

  searchQuery = new BehaviorSubject<string>('');
  averageAllSLP: number = 0;
  averageAllUSD: number = 0;
  averageElo: number = 0;

  constructor(private service: AuthService,
              private db: AngularFirestore,
              private scholarService: DialogService,
              public dialog: MatDialog,
              private userService: UserService,
  ) {
    this.authService = service;
    this.hideAddress = this.userService.hideAddress;
  }

  async ngOnInit(): Promise<void> {
    this.userService.getScholars().pipe(switchMap((scholars) => {
      const output: Observable<TopEarningData>[] = [];
      scholars.forEach((scholar) => {
        output.push(
          this.userService.getScholarsSLP(scholar.id).pipe(
            map((slp) => {
            return {
              name: scholar.name,
              average: this.getAverageSLP(slp) ?? 0,
            }
          }))
          )
      });
      return combineLatest(output);
    })).subscribe((listData) => {
      this.scholars = listData;
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
    this.scholarService.openEditDialog(newScholar);
  }

  hideAddresses(): void {
    this.hideAddress.next(!this.hideAddress.getValue());
  }

  refresh(): void {
    this.userService.refresh();
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

  openTopEarnerDialog(): void {
    this.dialog.open(TopEarnersComponent, {
      width: '400px',
    });
  }

  onSearch(query: string) {
    this.searchQuery.next(query);
  }

  openAverageColorDialog(): void {
    const dialogRef = this.dialog.open(AverageColorDialogComponent, {
      width: '400px',
    });
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
