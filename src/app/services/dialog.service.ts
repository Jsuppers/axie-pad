import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import firebase from 'firebase';
import { cloneDeep } from 'lodash';
import { ColorDialogComponent } from '../components/dialogs/color-dialog/color-dialog.component';
import { DeleteDialogComponent } from '../components/dialogs/delete-dialog/delete-dialog.component';
import { EditDialogComponent } from '../components/dialogs/edit-dialog/edit-dialog.component';
import { PayDialogComponent } from '../components/dialogs/pay-dialog/pay-dialog.component';
import { FirestoreScholar } from '../_models/scholar';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor(
    public dialog: MatDialog,
    private db: AngularFirestore,
    private authService: AuthService,
    private snackBar: MatSnackBar,) { }

  openPayDialog(scholar: FirestoreScholar): void {
    const dialogRef = this.dialog.open(PayDialogComponent, {
      width: '400px',
      data: cloneDeep(scholar),
    });

    dialogRef.afterClosed().subscribe(async (result: FirestoreScholar) => {
      const user = this.authService.userState.getValue();
      if (user && result) {
        result.paidTimes = (result?.paidTimes ?? 0) + 1;
        const userDocument = await this.db.collection('users').doc(user.uid).get().toPromise();
        await userDocument.ref.update({
          ['scholars.' + result.id + '.paidTimes']: result.paidTimes
        });
      }
    });
  }

  openEditDialog(scholar: FirestoreScholar): void {
    const dialogRef = this.dialog.open(EditDialogComponent, {
      width: '400px',
      data: cloneDeep(scholar),
    });

    dialogRef.afterClosed().subscribe(async (result: FirestoreScholar) => {
      const user = this.authService.userState.getValue();
      if (user && result) {
        result.managerShare = result?.managerShare ?? 30;
        result.scholarRoninAddress = result?.scholarRoninAddress?.trim() ?? '';
        result.roninAddress = result?.roninAddress?.trim() ?? '';
        const userDocument = await this.db.collection('users').doc(user.uid).get().toPromise();
        await userDocument.ref.update({
          ['scholars.' + result.id]: result
        });
      }
    });
  }

  openColorDialog(group: string): void {
    const dialogRef = this.dialog.open(ColorDialogComponent, {
      width: '400px',
      data: group,
    });

    dialogRef.afterClosed().subscribe(async (result: string) => {
      const user = this.authService.userState.getValue();
      if (user && result) {
        const userDocument = await this.db.collection('users').doc(user.uid).get().toPromise();
        await userDocument.ref.update({
          ['groupColors.' + group]: result
        });
      }
    });
  }

  openSnackBar(message: string): void {
    this.snackBar.open(message + ' copied', undefined, {duration: 5000, verticalPosition: 'top'});
  }

  deleteScholar(scholarId: string): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '200px',
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      const user = this.authService.userState.getValue();
      if (user && result) {
        const userDocument = await this.db.collection('users').doc(user.uid).get().toPromise();
        await userDocument.ref.update({
          ['scholars.' + scholarId]: firebase.firestore.FieldValue.delete(),
        });
      }
    });
  }

  navigateToScholar(roninAddress: string): void {
    window.open('https://marketplace.axieinfinity.com/profile/' + roninAddress + '/axie', '_blank');
  }
}
