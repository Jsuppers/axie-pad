import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialogRef } from '@angular/material/dialog';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user/user.service';
import { DefaultTable, Table } from 'src/app/_models/table';

@Component({
  selector: 'app-link-table-dialog',
  templateUrl: './link-table-dialog.component.html',
  styleUrls: ['./link-table-dialog.component.scss'],
})
export class LinkTableDialogComponent {
  private _linkedTables: Table[] = [];

  ownTableName = "";
  searchQuery = '';

  constructor(
    public dialogRef: MatDialogRef<LinkTableDialogComponent>,
    private userService: UserService,
    private db: AngularFirestore,
    private authService: AuthService
  ) {
    const user = this.authService.userState.getValue();

    combineLatest([
      this.userService.ownTableName,
      this.db
        .collection('tables', (ref) =>
          ref.where(`users.${btoa(user.email)}`, '!=', '')
        )
        .valueChanges()
        .pipe(
          map((tables) =>
            tables.map((table: { tableID: string; tableName: string }) =>
              DefaultTable(table.tableID, table.tableName)
            )
          )
        ),
    ]).subscribe(([ownTableName, tables]) => {
      this.ownTableName = ownTableName;
      this._linkedTables = tables;
    });
  }

  get linkedTables() {
    return this._linkedTables.filter(
      (table) =>
        table.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        table.tableID.includes(this.searchQuery)
    );
  }

  onLoadTable(table: Table) {
    this.userService.setTable(table);
    this.dialogRef.close();
  }

  onLoadOwnTable() {
    this.userService.setOwnTable();
    this.dialogRef.close();
  }
}
