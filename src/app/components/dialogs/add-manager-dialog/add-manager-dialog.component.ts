import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import _ from 'lodash';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog.service';
import { UserService } from 'src/app/services/user/user.service';
import { LinkedUser } from 'src/app/_models/linked-user';
import { Role } from 'src/app/_models/role';

@Component({
  selector: 'app-add-manager-dialog',
  templateUrl: './add-manager-dialog.component.html',
  styleUrls: ['./add-manager-dialog.component.scss']
})
export class AddManagerDialogComponent {
  linkedUsers: Record<string, LinkedUser>;
  role = Role;
  uid: string;

  constructor(
    public dialogRef: MatDialogRef<AddManagerDialogComponent>,
    private auth: AuthService,
    private snackBar: MatSnackBar,
    private userService: UserService) {
      this.auth.userState.subscribe((user) => this.uid = user.uid);
      this.userService.currentUser$().subscribe((user) => {
        this.linkedUsers = !_.isEmpty(user.linkedUsers) ? {..._.cloneDeep(user.linkedUsers)} : {};
      });
    }

  get isOwnTable() {
    return this.userService.tableID.getValue() === this.uid
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  addManager(): void {
    if(!!this.linkedUsers) {
      const newUser = LinkedUser('');
      this.linkedUsers[newUser.id] = newUser;
    }
  }

  reset(): void {
    this.linkedUsers = {};
  }

  removeUser(id: string): void {
    delete this.linkedUsers[id];
  }

  openSnackBar(message: string): void {
    this.snackBar.open(message + ' copied', undefined, {
      duration: 5000,
      verticalPosition: 'top',
    });
  }
}
