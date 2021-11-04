import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import _ from 'lodash';
import { defaultManagerShare, defaultScholarShare } from 'src/app/constants';
import { DialogService } from 'src/app/services/dialog.service';
import { UserService } from 'src/app/services/user/user.service';
import { PayShare } from 'src/app/_models/pay-share';

@Component({
  selector: 'app-pay-share-dialog',
  templateUrl: './pay-share-dialog.component.html',
  styleUrls: ['./pay-share-dialog.component.scss']
})
export class PayShareDialogComponent {
  payShares: PayShare[];

  constructor(
    public dialogRef: MatDialogRef<PayShareDialogComponent>,
    private scholarService: DialogService,
    private userService: UserService) {
      this.userService.currentUser$().subscribe((user) => {
        this.payShares = !_.isEmpty(user.defaults?.payshare) ? [..._.cloneDeep(user.defaults?.payshare)] : [];
      });
    }

  onNoClick(): void {
    this.dialogRef.close();
  }

  openSnackBar(message: string): void {
    this.scholarService.openSnackBar(message);
  }

  addPoint(): void {
    if(!!this.payShares) {
      this.payShares.push({
        manager: defaultManagerShare,
        scholar: defaultScholarShare,
      });
    }
  }

  reset(): void {
    this.payShares = [{
      manager: defaultManagerShare,
      scholar: defaultScholarShare,
    }];
  }

  updateScholarShare(payShare: PayShare): void {
    payShare.scholar = 100 - payShare.manager;
  }

  onChange(index: number, value: number) {
    this.payShares[index].manager = 100 - value;
  }
}
