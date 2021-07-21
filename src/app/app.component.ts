import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { NgcCookieConsentService } from 'ngx-cookieconsent';
import { UserService } from './services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { CurrencyDialogComponent } from './components/dialogs/currency-dialog/currency-dialog.component';
import { AngularFirestore } from '@angular/fire/firestore';
import getSymbolFromCurrency from 'currency-symbol-map'
import { TitleDialogComponent } from './components/dialogs/title-dialog/title-dialog.component';
import { filter } from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Axie Pad';
  fiatCurrency: string;
  fiatCurrencyTitle: string;
  SLPPrice: number;
  AXSPrice: number;

  constructor(private authService: AuthService,
              private userService: UserService,
              private dialog: MatDialog,
              private db: AngularFirestore,
              private ccService: NgcCookieConsentService) {
  }

  ngOnInit(): void {
    this.userService.getFiatCurrency().subscribe((currency) => {
      this.fiatCurrencyTitle = currency;
      this.fiatCurrency = getSymbolFromCurrency(currency);
    });
    this.userService.getSLPPrice().subscribe((slpPrice) => {
      this.SLPPrice = slpPrice;
    });
    this.userService.getAXSPrice().subscribe((axsPrice) => {
      this.AXSPrice = axsPrice;
    });
    this.userService.getTitle().subscribe((title) => {
      this.title = title ? title : 'Axie Pad';
    });
  }

  signOut(): void {
    this.authService.SignOut();
  }

  signedIn(): boolean {
    return this.authService.userState.getValue() != null;
  }

  openTitleDialog(): void {
    const dialogRef = this.dialog.open(TitleDialogComponent, {
      width: '400px',
      data: this.title,
    });

    dialogRef.afterClosed().subscribe(async (result: string) => {
      const user = this.authService.userState.getValue();
      if (user && result) {
        const userDocument = await this.db.collection('users').doc(user.uid).get().toPromise();
        await userDocument.ref.update({
          ['title']: result
        });
      }
    });
  }

  openCurrencyDialog(): void {
    const dialogRef = this.dialog.open(CurrencyDialogComponent, {
      width: '400px',
      data: this.fiatCurrency,
    });

    dialogRef.afterClosed().subscribe(async (result: string) => {
      const user = this.authService.userState.getValue();
      if (user && result) {
        const userDocument = await this.db.collection('users').doc(user.uid).get().toPromise();
        await userDocument.ref.update({
          ['currency']: result
        });
      }
    });
  }

  navigateSLPChart(): void {
    window.open('https://www.coingecko.com/en/coins/smooth-love-potion', '_blank');
  }

  navigateAXSChart(): void {
    window.open('https://www.coingecko.com/en/coins/axie-infinity', '_blank');
  }
}
