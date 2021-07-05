import { Component, Input, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { FirestoreScholar, PaymentMethods } from '../../_models/scholar';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
import { AuthService } from '../../services/auth.service';
import { cloneDeep } from 'lodash';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import firebase from 'firebase';
import { UserService } from '../../services/user.service';
import { filter } from 'rxjs/operators';

interface TableData extends FirestoreScholar {
  roninName: string;
  scholarRoninName: string;
}

@Component({
  selector: 'app-profile-table',
  templateUrl: './profile-table.component.html',
  styleUrls: ['./profile-table.component.scss']
})
export class ProfileTableComponent implements OnInit {
  displayedColumns: string[] = [
    'name',
    'roninAddress',
    'scholarRoninAddress',
    'scholarEthAddress',
    'actions',
  ];
  readonly paymentMethods = PaymentMethods;
  dataSource: MatTableDataSource<TableData>;
  @Input()
  hideAddress$: Observable<boolean>;
  hideAddresses: boolean;
  @Input()
  newScholar$: Observable<FirestoreScholar>;

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
          ...scholar,
          roninName: scholar?.roninName ?? 'unknown',
          scholarRoninName: scholar?.scholarRoninName ?? 'unknown',
        });
      });
      this.dataSource = new MatTableDataSource(tableData);
      this.dataSource.sort = this.sort;
    });
    this.hideAddress$.subscribe((hideAddresses) => {
      this.hideAddresses = hideAddresses;
    });
    this.newScholar$.pipe(filter((scholar) => !!scholar)).subscribe((newScholar) => {
      this.openDialog(newScholar);
    });
  }

  editScholar(data: TableData): void {
    this.openDialog({
      ...data,
    });
  }

  openDialog(scholar: FirestoreScholar): void {
    const dialogRef = this.dialog.open(EditDialogComponent, {
      width: '400px',
      data: cloneDeep(scholar),
    });

    dialogRef.afterClosed().subscribe(async (result: FirestoreScholar) => {
      if (result) {
        result.managerShare = result?.managerShare ?? 30;
        result.scholarRoninAddress = result?.scholarRoninAddress?.trim() ?? '';
        result.roninAddress = result?.roninAddress?.trim() ?? '';
        const userDocument = await this.db.collection('users').doc(this.authService.userState.uid).get().toPromise();
        await userDocument.ref.update({
          ['scholars.' + result.id]: result
        });
      }
    });
  }

  openSnackBar(message: string): void {
    this.snackBar.open(message + ' copied', undefined, {duration: 5000});
  }

  deleteScholar(scholar: TableData): void {
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

  navigateToScholar(element: FirestoreScholar): void {
    window.open('https://marketplace.axieinfinity.com/profile/' + element.roninAddress.replace('ronin:', '0x') + '/axie', '_blank');
  }
}
