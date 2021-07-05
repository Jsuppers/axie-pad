import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { DefaultFirestoreScholar, FirestoreScholar } from '../../_models/scholar';
import firebase from 'firebase';
import { UserService } from '../../services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { CurrencyDialogComponent } from '../currency-dialog/currency-dialog.component';

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
    this.userService.getTotalSLP().subscribe((totalSLP) => this.totalSLP = totalSLP);
    this.userService.getTotalFiat().subscribe((fiatTotal) => this.totalFiat = fiatTotal);
    this.userService.getFiatCurrency().subscribe((currency) => this.fiatCurrency = currency);
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

  openCurrencyDialog(): void {
    const dialogRef = this.dialog.open(CurrencyDialogComponent, {
      width: '400px',
      data: this.fiatCurrency,
    });

    dialogRef.afterClosed().subscribe(async (result: string) => {
      if (result) {
        const userDocument = await this.db.collection('users').doc(this.authService.userState.uid).get().toPromise();
        await userDocument.ref.update({
          ['currency']: result
        });
      }
    });
  }
}
