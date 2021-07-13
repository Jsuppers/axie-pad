import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-donate',
  templateUrl: './donate.component.html',
  styleUrls: ['./donate.component.scss']
})
export class DonateComponent implements OnInit {
  ethAddress = '0x509eFF672dd32215Fed920499302BBaFCc2E1513';
  roninAddress = 'ronin:509eff672dd32215fed920499302bbafcc2e1513';

  constructor(private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
  }

  openSnackBar(message: string): void {
    this.snackBar.open(message + ' copied', undefined, { verticalPosition: 'top'});
  }
}
