import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Apollo } from 'apollo-angular';
import { DialogService } from 'src/app/services/dialog.service';
import { RoninNames } from 'src/app/services/user/helpers/ronin-names';
import { UserService } from 'src/app/services/user/user.service';
import { PaymentMethods, Scholar } from 'src/app/_models/scholar';

@Component({
  selector: 'app-pay-dialog',
  templateUrl: './pay-dialog.component.html',
  styleUrls: ['./pay-dialog.component.scss']
})
export class PayDialogComponent {
  readonly paymentMethods = PaymentMethods;
  _roninNames: RoninNames;

  constructor(
    public dialogRef: MatDialogRef<PayDialogComponent>,
    private scholarService: DialogService,
    private apollo: Apollo,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: Scholar) {
      this._roninNames = new RoninNames(apollo);
      if (!data.roninAddress || data.roninName === 'unknown') {
        this._roninNames.getRoninName(data);
      }
      if (!data.scholarRoninName || data.scholarRoninName === 'unknown') {
        this._roninNames.getScholarRoninName(data);
      }
      this.userService.updateSLP(data);
    }

  onNoClick(): void {
    this.dialogRef.close();
  }

  openSnackBar(message: string): void {
    this.scholarService.openSnackBar(message);
  }
}
