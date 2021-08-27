import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { UserService } from 'src/app/services/user/user.service';
import { FirestoreScholar, PaymentMethods } from '../../../_models/scholar';

@Component({
  selector: 'app-edit-dialog',
  templateUrl: './edit-dialog.component.html',
  styleUrls: ['./edit-dialog.component.scss']
})
export class EditDialogComponent implements OnInit{
  readonly paymentMethods = PaymentMethods;
  myControl = new FormControl();
  options: string[] = [];

  constructor(
    private userService: UserService,
    public dialogRef: MatDialogRef<EditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FirestoreScholar) {
      this.options = this.userService.groups;
    }

    filteredOptions: Observable<string[]>;

    ngOnInit() {
      this.filteredOptions = this.myControl.valueChanges
        .pipe(
          startWith(''),
          map(name => name ? this._filter(name) : this.options.slice())
        );
    }


  onNoClick(): void {
    this.dialogRef.close();
  }


  displayFn(user: string): string {
    return user && user ? user : '';
  }

  private _filter(name: string): string[] {
    const filterValue = name.toLowerCase();

    return this.options.filter(option => option.toLowerCase().includes(filterValue));
  }
}
