import { Inject } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirestoreScholar } from 'src/app/_models/scholar';
import { User } from 'src/app/_models/user';

@Component({
  selector: 'app-currency-dialog',
  templateUrl: './currency-dialog.component.html',
  styleUrls: ['./currency-dialog.component.scss']
})
export class CurrencyDialogComponent {
  currency: string;

  constructor(
    public dialogRef: MatDialogRef<CurrencyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string) {
      this.currency = data;
    }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
