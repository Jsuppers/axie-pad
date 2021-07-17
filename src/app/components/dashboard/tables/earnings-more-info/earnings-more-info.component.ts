import { Component, Input, OnInit } from '@angular/core';
import { DialogService } from 'src/app/services/dialog.service';
import { UserService } from 'src/app/services/user.service';
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

  constructor(
    private userService: UserService,
    private dialogService: DialogService) {

  }

  ngOnInit(): void {
    if (!this.scholar.scholar.roninName || this.scholar.scholar.roninName === 'unknown') {
      this.userService.getRoninName(this.scholar.scholar);
    }
    if (!this.scholar.scholar.scholarRoninName || this.scholar.scholar.scholarRoninName === 'unknown') {
      this.userService.getScholarRoninName(this.scholar.scholar);
    }
  }

  openSnackBar(message: string): void {
    this.dialogService.openSnackBar(message);
  }

  getLastClaimDate(): string {
    return new Date(this.scholar.scholar.slp.lastClaimed * 1000).toLocaleString();
  }

  getNextClaimDate(): string {
    return new Date((this.scholar.scholar.slp.lastClaimed + (60 * 60 * 24 * 14)) * 1000).toLocaleString();
  }
}
