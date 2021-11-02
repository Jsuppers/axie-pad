import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialogRef } from '@angular/material/dialog';
import { MatTable } from '@angular/material/table';
import { UserService } from 'src/app/services/user/user.service';
import {
  DefaultFirestoreScholar,
  FirestoreScholar,
} from 'src/app/_models/scholar';

@Component({
  selector: 'app-import-dialog',
  templateUrl: './import-dialog.component.html',
  styleUrls: ['./import-dialog.component.scss'],
})
export class ImportDialogComponent {
  private _uploadedScholars: FirestoreScholar[] = [];

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
    'paidTimes',
  ];
  dataSource = [];
  content = '';
  importing = false;

  @ViewChild(MatTable) table: MatTable<FirestoreScholar>;

  constructor(
    public dialogRef: MatDialogRef<ImportDialogComponent>,
    private db: AngularFirestore,
    private userService: UserService,
  ) {}

  get numberOfUploaded() {
    return this._uploadedScholars.length;
  }

  onUploadFile(input: HTMLInputElement) {
    input.click();
  }

  handleFileUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files[0];

    if (file) {
      const reader = new FileReader();

      reader.readAsText(file);
      reader.onload = () => {
        const csv = reader.result as string;

        const rows = csv.split('\n');

        // Remove the first header row
        rows.shift();

        this.content = rows.join('\n');
        this.onUpdate();
      };
    }
  }

  onUpdate() {
    const rows = this.content.split('\n');

    this._uploadedScholars = [];

    rows.forEach((row) => {
      // Remove " and \r character and split each rows
      const columns = row.replace(/["\r]/g, '').split(','); // Split between comma

      if (columns.length !== 10) {
        return;
      }

      const scholar = DefaultFirestoreScholar();

      scholar.roninAddress = columns[0] || '';
      scholar.name = columns[1] || '';
      scholar.group = columns[2] || '';
      scholar.email = columns[3] || '';

      const useOwnPayShare = columns[4];
      scholar.useOwnPayShare =
        useOwnPayShare === 'true' || useOwnPayShare === 'TRUE'
          ? true
          : false;

      const managerShare = columns[5];
      scholar.managerShare = Number.isNaN(managerShare)
        ? 0
        : Number(managerShare);

      scholar.preferredPaymentMethod = columns[6] === 'ronin' ? 0 : 1;
      scholar.scholarRoninAddress = columns[7] || '';
      scholar.scholarEthAddress = columns[8] || '';
      scholar.paidTimes = Number(columns[9]);

      this._uploadedScholars.push(scholar);
    });

    this.dataSource = this._uploadedScholars;
  }

  async onImport() {
    this.importing = true;

    const uid = this.userService.tableID.getValue();
    if (uid) {
      const batch = this.db.firestore.batch();
      for (const scholar of this._uploadedScholars) {
        const insert = this.db.collection('users').doc(uid).ref;
        batch.update(insert, {
          ['scholars.' + scholar.id]: scholar
        });
      }
      await batch.commit();
    }

    this.importing = false;
    this.dialogRef.close();
  }
}
