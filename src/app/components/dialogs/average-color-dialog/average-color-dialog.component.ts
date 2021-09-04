import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialogRef } from '@angular/material/dialog';
import { isEmpty } from 'lodash';
import { defaultColors } from 'src/app/constants';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user/user.service';

@Component({
  selector: 'app-average-color-dialog',
  templateUrl: './average-color-dialog.component.html',
  styleUrls: ['./average-color-dialog.component.scss']
})
export class AverageColorDialogComponent implements OnInit {
  colors: number[] = defaultColors;

  constructor(
    public dialogRef: MatDialogRef<AverageColorDialogComponent>,
    private authService: AuthService,
    private userService: UserService,
    private db: AngularFirestore,
    ) {
    }

  async ngOnInit(): Promise<void> {
    this.userService.currentUser$().subscribe((user) => {
      if(user && !isEmpty(user.colors) && user.colors.length === 3) {
        this.colors = user.colors;
      }
    })
  }

  async save(): Promise<void> {
    const uid = this.userService.tableID.getValue();
    if (uid) {
      const userDocument = await this.db.collection('users').doc(uid).get().toPromise();
      await userDocument.ref.update({
        ['colors']: this.colors,
      });
      this.dialogRef.close();
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
