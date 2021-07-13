import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { DefaultFirestoreScholar, FirestoreScholar } from '../../_models/scholar';
import firebase from 'firebase';
import { UserService } from '../../services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { CurrencyDialogComponent } from '../currency-dialog/currency-dialog.component';
import getSymbolFromCurrency from 'currency-symbol-map'

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  authService: AuthService;
  userDocument: firebase.firestore.DocumentSnapshot<unknown>;

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
  newScholar: BehaviorSubject<FirestoreScholar> = new BehaviorSubject<FirestoreScholar>(null);
  hideAddress: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private service: AuthService,
              private db: AngularFirestore,
              public dialog: MatDialog,
              private userService: UserService,
  ) {
    this.authService = service;
  }

  async ngOnInit(): Promise<void> {
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
    this.userService.getSLPPrice().subscribe((slpPrice) => {
      this.SLPPrice = slpPrice;
    });
    this.userService.getAXSPrice().subscribe((axsPrice) => {
      this.AXSPrice = axsPrice;
    });
  }

  addNewScholar(): void {
    const newScholar = DefaultFirestoreScholar();
    this.newScholar.next(newScholar);
  }

  hideAddresses(): void {
    this.hideAddress.next(!this.hideAddress.getValue());
  }

  refresh(): void {
    this.userService.refresh();
  }

  navigateSLPChart(): void {
    window.open('https://www.coingecko.com/en/coins/smooth-love-potion', '_blank');
  }

  navigateAXSChart(): void {
    window.open('https://www.coingecko.com/en/coins/axie-infinity', '_blank');
  }
}
