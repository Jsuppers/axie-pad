import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-import-dialog',
  templateUrl: './import-dialog.component.html',
  styleUrls: ['./import-dialog.component.scss'],
})
export class ImportDialogComponent implements OnInit {
  displayedColumns: string[] = [
    'roninAddress',
    'name',
    'group',
    'email',
    'useOwnPayShare',
    'managerShare',
    'preferredPaymentMethod',
    'scholarRoninAddress',
    'scholarEthAddress',
  ];
  dataSource = [];

  constructor() {}

  ngOnInit(): void {}

  onImport() {
    // TODO: Importing logic
  }
}
