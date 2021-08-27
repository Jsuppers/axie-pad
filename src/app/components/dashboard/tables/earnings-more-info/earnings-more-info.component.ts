import { Component, Input, OnInit } from '@angular/core';
import { DialogService } from 'src/app/services/dialog.service';
import { UserService } from 'src/app/services/user/user.service';
import { PaymentMethods } from 'src/app/_models/scholar';
import { TableEarningsData } from '../earnings-table/earnings-table.component';

@Component({
  selector: 'app-earnings-more-info',
  templateUrl: './earnings-more-info.component.html',
  styleUrls: ['./earnings-more-info.component.scss']
})
export class EarningsMoreInfoComponent implements OnInit {
  @Input()
  scholar: TableEarningsData;
  paymentMethods = PaymentMethods;
  roninName: string;
  scholarRoninName: string;

  constructor(
    private user: UserService,
    private dialogService: DialogService) {
  }

  ngOnInit(): void {
    const roninName = this.user.getRoninName(this.scholar.scholar.roninAddress);
    if (!roninName || roninName === 'unknown') {
      this.user.updateRoninName(this.scholar.scholar).then((roninName) => this.roninName = roninName);
    }

    const scholarRoninName = this.user.getRoninName(this.scholar.scholar.scholarRoninAddress);
    if (!scholarRoninName || scholarRoninName === 'unknown') {
      this.user.updateScholarRoninName(this.scholar.scholar).then((roninName) => this.scholarRoninName = roninName);
    }
  }

  openSnackBar(message: string): void {
    this.dialogService.openSnackBar(message);
  }

  getLastClaimDate(): string {
    return new Date(this.scholar.slp.lastClaimed * 1000).toLocaleString();
  }

  getNextClaimDate(): string {
    return new Date((this.scholar.slp.lastClaimed + (60 * 60 * 24 * 14)) * 1000).toLocaleString();
  }
}
