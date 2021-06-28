import { Component, Input, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { DefaultScholar, Scholar } from '../../_models/scholar';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
import { AuthService } from '../../services/auth.service';
import { cloneDeep } from 'lodash';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import firebase from 'firebase';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit {
  displayedColumns: string[] = [
    'name',
    'accountEthAddress',
    'scholarRoninAddress',
    'notClaimableSLP',
    'claimableSLP',
    'totalSLP',
    'claimableDate',
    'edit',
  ];
  dataSource: MatTableDataSource<Scholar>;
  @Input()
  scholars$: Observable<Scholar[]>;
  @Input()
  newScholar$: Observable<Scholar>;
  @Input()
  hideAddress$: Observable<boolean>;
  hideAddresses: boolean;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    public dialog: MatDialog,
    private db: AngularFirestore,
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {
  }

  ngOnInit(): void {
    this.scholars$.subscribe((scholars) => {
      this.dataSource = new MatTableDataSource(scholars);
      this.dataSource.sort = this.sort;
    });
    this.newScholar$.subscribe((newScholar) => {
      if (newScholar) {
        this.openDialog(newScholar);
      }
    });
    this.hideAddress$.subscribe((hideAddresses) => {
      this.hideAddresses = hideAddresses;
    });
  }

  openDialog(scholar: Scholar): void {
    const dialogRef = this.dialog.open(EditDialogComponent, {
      width: '400px',
      data: cloneDeep(scholar),
    });

    dialogRef.afterClosed().subscribe(async (result: Scholar) => {
      if (result) {
        result.scholarRoninAddress = result.scholarRoninAddress?.trim() ?? '';
        result.accountEthAddress = result.accountEthAddress?.trim() ?? '';
        const userDocument = await this.db.collection('users').doc(this.authService.userState.uid).get().toPromise();
        await userDocument.ref.update({
          ['scholars.' + result.id]: result
        });
      }
    });
  }

  openSnackBar(message: string): void {
    this.snackBar.open(message + ' copied');
  }

  deleteScholar(scholar: Scholar): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '200px',
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        const userDocument = await this.db.collection('users').doc(this.authService.userState.uid).get().toPromise();
        await userDocument.ref.update({
          ['scholars.' + scholar.id]: firebase.firestore.FieldValue.delete(),
        });
      }
    });
  }

  getClaimableDate(element: Scholar): string {
    const dateFuture: any = new Date((element.lastClaimed + (60 * 60 * 24 * 14)) * 1000);
    const dateNow: any = new Date();

    const seconds = Math.floor((dateFuture - (dateNow)) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return days + ' days, ' + (hours - (days * 24)) + ' hours';
  }

  formatAddress(address: any): string {
    return this.hideAddresses ? '*'.repeat(10) : address.substring(0, 10) + '...' + address.substring(address.length - 5, address.length);
  }

  navigateToScholar(element: Scholar): void {
    window.open('https://marketplace.axieinfinity.com/profile/' + element.accountEthAddress + '/axie', '_blank');
  }
}
