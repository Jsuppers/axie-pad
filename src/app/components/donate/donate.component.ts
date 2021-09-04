import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-donate',
  templateUrl: './donate.component.html',
  styleUrls: ['./donate.component.scss']
})
export class DonateComponent implements OnInit {
  ethAddress = '0x1d4C3D2A27D77Ab6C2Cf0DEf4b5d9be551272424';
  roninAddress = 'ronin:1d4c3d2a27d77ab6c2cf0def4b5d9be551272424';
  totalDonations: number;

  constructor(private snackBar: MatSnackBar) {
    this.totalDonations = 0;
    // todo automate this
  }

  ngOnInit(): void {
  }

  openSnackBar(message: string): void {
    this.snackBar.open(message + ' copied', undefined, { verticalPosition: 'top'});
  }
}
