import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FirestoreScholar } from '../../../_models/scholar';

@Component({
  selector: 'app-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  styleUrls: ['./delete-dialog.component.scss']
})
export class DeleteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FirestoreScholar) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
