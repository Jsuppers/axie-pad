import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-title-dialog',
  templateUrl: './title-dialog.component.html',
  styleUrls: ['./title-dialog.component.scss']
})
export class TitleDialogComponent {
  title: string;

  constructor(
    public dialogRef: MatDialogRef<TitleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string) {
      this.title = data;
    }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
