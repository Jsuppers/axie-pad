import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { NgcCookieConsentService } from 'ngx-cookieconsent';
import { UserService } from './services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { CurrencyDialogComponent } from './components/currency-dialog/currency-dialog.component';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'axie-pad';
  fiatCurrency: string;

  constructor(private authService: AuthService,
              private userService: UserService,
              private dialog: MatDialog,
              private db: AngularFirestore,
              private ccService: NgcCookieConsentService) {
  }

  ngOnInit(): void {
    this.userService.getFiatCurrency().subscribe((currency) => {
      this.fiatCurrency = currency;
    });
  }

  signOut(): void {
    this.authService.SignOut();
  }

  signedIn(): boolean {
    return this.authService.userState.getValue() != null;
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
}
