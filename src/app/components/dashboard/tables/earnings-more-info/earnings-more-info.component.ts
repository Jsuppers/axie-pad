import { Component, Input, OnInit } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { DialogService } from 'src/app/services/dialog.service';
import { RoninNames } from 'src/app/services/user/helpers/ronin-names';
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
  _roninNames: RoninNames;

  constructor(
    private userService: UserService,
    private apollo: Apollo,
    private dialogService: DialogService) {
      this._roninNames = new RoninNames(apollo);
  }

  ngOnInit(): void {
    if (!this.scholar.scholar.roninName || this.scholar.scholar.roninName === 'unknown') {
      this._roninNames.getRoninName(this.scholar.scholar);
    }
    if (!this.scholar.scholar.scholarRoninName || this.scholar.scholar.scholarRoninName === 'unknown') {
      this._roninNames.getScholarRoninName(this.scholar.scholar);
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
