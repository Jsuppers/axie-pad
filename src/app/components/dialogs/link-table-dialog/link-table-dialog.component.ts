import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialogRef } from '@angular/material/dialog';
import _ from 'lodash';
import { combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user/user.service';
import { DefaultTable, Table } from 'src/app/_models/table';

@Component({
  selector: 'app-link-table-dialog',
  templateUrl: './link-table-dialog.component.html',
  styleUrls: ['./link-table-dialog.component.scss'],
})
export class LinkTableDialogComponent {
  private _currentTables: Record<string, Table> = {};
  private _linkedTables: Table[] = [];

  searchQuery = '';
  tablesToBeAdded: Table[] = [];

  constructor(
    public dialogRef: MatDialogRef<LinkTableDialogComponent>,
    private userService: UserService,
    private db: AngularFirestore,
    private authService: AuthService
  ) {
    const user = this.authService.userState.getValue();

    combineLatest([
      this.userService.ownLinkedTables,
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
    ]).subscribe(([currentTables, tables]) => {
      this._currentTables = currentTables;
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

  isAvailable(tableId: string) {
    let result = true;

    Object.values(this._currentTables).forEach((table) => {
      if (table.tableID === tableId) {
        result = false;
      }
    });

    return result;
  }

  isAdded(table: Table) {
    return Boolean(
      this.tablesToBeAdded.find((_) => _.tableID === table.tableID)
    );
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onAddTable(table: Table): void {
    this.tablesToBeAdded.push(table);
  }

  onRemoveTable(table: Table): void {
    this.tablesToBeAdded = this.tablesToBeAdded.filter(
      (_) => _.tableID !== table.tableID
    );
  }

  onSave() {
    const result = {
      ...this._currentTables,
      ...this.tablesToBeAdded.reduce((currentResult, currentTable) => {
        return (currentResult = {
          ...currentResult,
          [currentTable.id]: currentTable,
        });
      }, {}),
    };

    this.dialogRef.close(result);
  }
}
