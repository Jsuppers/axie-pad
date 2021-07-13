import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ScholarService } from 'src/app/services/scholar.service';
import { UserService } from 'src/app/services/user.service';
import { PaymentMethods, Scholar } from 'src/app/_models/scholar';

@Component({
  selector: 'app-pay-dialog',
  templateUrl: './pay-dialog.component.html',
  styleUrls: ['./pay-dialog.component.scss']
})
export class PayDialogComponent {
  readonly paymentMethods = PaymentMethods;

  constructor(
    public dialogRef: MatDialogRef<PayDialogComponent>,
    private scholarService: ScholarService,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: Scholar) {
      if (!data.scholarRoninName || data.scholarRoninName === 'unknown') {
        this.userService.getScholarRoninName(data);
      }
    }

  onNoClick(): void {
    this.dialogRef.close();
  }

  openSnackBar(message: string): void {
    this.scholarService.openSnackBar(message);
  }
}
