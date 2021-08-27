import { Color } from '@angular-material-components/color-picker';
import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormControl } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { isEmpty } from 'lodash';
import { UserService } from 'src/app/services/user/user.service';
import { FirestoreScholar } from 'src/app/_models/scholar';

@Component({
  selector: 'app-color-dialog',
  templateUrl: './color-dialog.component.html',
  styleUrls: ['./color-dialog.component.scss']
})
export class ColorDialogComponent  {
  public touchUi = false;
  colorCtr: AbstractControl = new FormControl(null);

  constructor(
    private userService: UserService,
    public dialogRef: MatDialogRef<ColorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string) {
      this.userService.currentUser$().subscribe((user) => {
        const currentColor = user.groupColors?.[data];
        if( !isEmpty(currentColor) ) {
            var r = parseInt(currentColor.slice(0, 2), 16),
                g = parseInt(currentColor.slice(2, 4), 16),
                b = parseInt(currentColor.slice(4, 6), 16);
          this.colorCtr.setValue(new Color(r,g,b));
        }
      });
    }


  onNoClick(): void {
    this.dialogRef.close();
  }
}
