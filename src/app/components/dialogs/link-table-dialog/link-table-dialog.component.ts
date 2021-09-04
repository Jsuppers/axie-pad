import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import _ from 'lodash';
import { UserService } from 'src/app/services/user/user.service';
import { DefaultTable, Table } from 'src/app/_models/table';

@Component({
  selector: 'app-link-table-dialog',
  templateUrl: './link-table-dialog.component.html',
  styleUrls: ['./link-table-dialog.component.scss']
})
export class LinkTableDialogComponent {
  linkedTables: Record<string, Table>;

  constructor(
    public dialogRef: MatDialogRef<LinkTableDialogComponent>,
    private userService: UserService) {
      this.userService.ownLinkedTables.subscribe((tables) => {
        this.linkedTables = tables;
      });
    }

  onNoClick(): void {
    this.dialogRef.close();
  }

  addTable(): void {
    if(!!this.linkedTables) {
      const newTable = DefaultTable();
      this.linkedTables[newTable.id] = newTable;
    }
  }

  reset(): void {
    this.linkedTables = {};
  }

  removeUser(id: string): void {
    delete this.linkedTables[id];
  }
}
