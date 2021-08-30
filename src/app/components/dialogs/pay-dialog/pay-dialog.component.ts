import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog.service';
import { UserService } from 'src/app/services/user/user.service';
import { FirestoreScholar, PaymentMethods } from 'src/app/_models/scholar';
import { SLP } from 'src/app/_models/slp';

@Component({
  selector: 'app-pay-dialog',
  templateUrl: './pay-dialog.component.html',
  styleUrls: ['./pay-dialog.component.scss']
})
export class PayDialogComponent {
  readonly paymentMethods = PaymentMethods;
  roninName: string;
  scholarRoninName: string;
  slp: SLP;

  constructor(
    public dialogRef: MatDialogRef<PayDialogComponent>,
    private scholarService: DialogService,
    private user: UserService,
    @Inject(MAT_DIALOG_DATA) public data: FirestoreScholar) {
      const roninName = this.user.getRoninName(this.data.roninAddress);

    this.user.getScholarsSLP(data.id).subscribe((slp) => this.slp = slp);
    if (!roninName || roninName === 'unknown') {
      this.user.updateRoninName(this.data).then((roninName) => this.roninName = roninName);
    }

    const scholarRoninName = this.user.getRoninName(this.data.scholarRoninAddress);
    if (!scholarRoninName || scholarRoninName === 'unknown') {
      this.user.updateScholarRoninName(this.data).then((roninName) => this.scholarRoninName = roninName);
    }
      this.user.updateSLP(data);
    }

  onNoClick(): void {
    this.dialogRef.close();
  }

  openSnackBar(message: string): void {
    this.scholarService.openSnackBar(message);
  }
}
