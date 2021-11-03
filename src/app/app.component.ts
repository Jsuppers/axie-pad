import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { NgcCookieConsentService } from 'ngx-cookieconsent';
import { UserService } from './services/user/user.service';
import { MatDialog } from '@angular/material/dialog';
import { CurrencyDialogComponent } from './components/dialogs/currency-dialog/currency-dialog.component';
import { AngularFirestore } from '@angular/fire/firestore';
import getSymbolFromCurrency from 'currency-symbol-map'
import { TitleDialogComponent } from './components/dialogs/title-dialog/title-dialog.component';
import { BehaviorSubject } from 'rxjs';
import { PayShareDialogComponent } from './components/dialogs/pay-share-dialog/pay-share-dialog.component';
import { PayShare } from './_models/pay-share';
import { LinkedUser } from './_models/linked-user';
import { AddManagerDialogComponent } from './components/dialogs/add-manager-dialog/add-manager-dialog.component';
import { LinkTableDialogComponent } from './components/dialogs/link-table-dialog/link-table-dialog.component';
import { Table } from './_models/table';
import _ from 'lodash';
import { NotificationRulesComponent } from './components/dialogs/notification-rules/notification-rules.component';
import { Rule, RuleType } from './_models/rule';
import { CsvService } from './services/csv.service';
import { ImportDialogComponent } from './components/dialogs/import-dialog/import-dialog.component';
import { NotesDialogComponent } from './components/dialogs/notes-dialog/notes-dialog.component';
import { DonateDialogComponent } from './components/dialogs/donate-dialog/donate-dialog.component';

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
  hideAddress: BehaviorSubject<boolean>;
  linkedTables: Table[];
  ownTableTitle: string;
  noOfNotes: number = 0;

  constructor(private authService: AuthService,
              private userService: UserService,
              private dialog: MatDialog,
              private db: AngularFirestore,
              private ccService: NgcCookieConsentService,
              private csvService: CsvService) {
      this.hideAddress = this.userService.hideAddress;
      this.userService.ownLinkedTables.subscribe((tables) => {
        this.linkedTables = Object.values(tables ?? {});
      });
      this.userService.ownTableName.subscribe((name) => {
        this.ownTableTitle = name;
      });
  }

  hideAddresses(): void {
    this.hideAddress.next(!this.hideAddress.getValue());
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
    this.userService.getScholars().subscribe((scholars) => {
      this.noOfNotes = scholars.reduce<number>((result, scholar) => {
        return scholar.note ? result + 1 : result;
      },  0);
    })
  }

  setOwnTable(): void {
    this.userService.setOwnTable();
  }

  setTable(table: Table): void {
    this.userService.setTable(table);
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
      const uid = this.userService.tableID.getValue();
      if (uid && result) {
        const userDocument = await this.db.collection('users').doc(uid).get().toPromise();
        await userDocument.ref.update({
          ['title']: result
        });
      }
    });
  }

  openAddManagerDialog(): void {
    const dialogRef = this.dialog.open(AddManagerDialogComponent, {
      width: '400px',
      maxHeight: '90vh',
    });

    dialogRef.afterClosed().subscribe(async (result: Record<string, LinkedUser>) => {
      const uid = this.userService.tableID.getValue();
      if (uid && result) {
        const userDocument = await this.db.collection('users').doc(uid).get().toPromise();
        const newLinkedUsers: Record<string, LinkedUser> = {};
        Object.values(result ?? {}).forEach((user) => {
          if (!_.isEmpty(user.email)) {
            user.id = btoa(user.email);
            newLinkedUsers[user.id] = user;
          }
        });

        await userDocument.ref.update({
          ['linkedUsers']: newLinkedUsers
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


  shareDialog(): void {
    const dialogRef = this.dialog.open(PayShareDialogComponent, {
      width: '400px',
      maxHeight: '90vh',
    });

    dialogRef.afterClosed().subscribe(async (result: PayShare[]) => {
      const uid = this.userService.tableID.getValue();
      if (uid && result) {
        const userDocument = await this.db.collection('users').doc(uid).get().toPromise();
        await userDocument.ref.update({
          ['defaults.payshare']: result
        });
      }
    });
  }

  addTable(): void {
    const dialogRef = this.dialog.open(LinkTableDialogComponent, {
      width: '400px',
      maxHeight: '90vh',
    });

    dialogRef.afterClosed().subscribe(async (result: Record<string, Table>) => {
      const user = this.authService.userState.getValue();
      if (user && result) {
        const userDocument = await this.db.collection('users').doc(user.uid).get().toPromise();
        await userDocument.ref.update({
          ['linkedTables']: result
        });
      }
    });
  }

  showNotificationDialog(): void {
    const dialogRef = this.dialog.open(NotificationRulesComponent, {
      width: '90%',
      maxWidth: '600px',
      maxHeight: '90vh',
    });

    dialogRef.afterClosed().subscribe(async (result: Record<string, Rule>) => {
      const uid = this.userService.tableID.getValue();
      if (uid && result) {
        const userDocument = await this.db.collection('users').doc(uid).get().toPromise();
        await userDocument.ref.update({
          ['notificationRules']: result
        });
      }
    });
  }

  onExport() {
    this.csvService.export();
  }

  onImport() {
    this.dialog.open(ImportDialogComponent, {
      width: '90vw',
      height: '90vh'
    });
  }

  showNotes() {
    this.dialog.open(NotesDialogComponent, {
      width: '90vw',
      maxWidth: '600px',
      height: '90vh',
    });
  }

  openDonateDialog() {
    this.dialog.open(DonateDialogComponent, {
      width: '90vw',
      maxWidth: '600px',
    })
  }
}
