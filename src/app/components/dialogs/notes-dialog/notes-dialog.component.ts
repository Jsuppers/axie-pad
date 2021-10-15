import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';

import { UserService } from 'src/app/services/user/user.service';
import { FirestoreScholar } from 'src/app/_models/scholar';

type EditableScholarNote = FirestoreScholar & {
  editing: boolean;
  expanded: boolean;
};

@Component({
  selector: 'app-notes-dialog',
  templateUrl: './notes-dialog.component.html',
  styleUrls: ['./notes-dialog.component.scss'],
})
export class NotesDialogComponent implements OnInit {
  _scholars: EditableScholarNote[] = [];
  isScholarWithNote = true;

  constructor(private user: UserService, private db: AngularFirestore) {}

  ngOnInit(): void {
    this.user
      .getScholars()
      .pipe(
        map((scholars) =>
          scholars.map((scholar) => ({
            ...scholar,
            editing: false,
            expanded: false,
          }))
        )
      )
      .subscribe((scholars) => {
        this._scholars = scholars;
      });
  }

  get scholars() {
    return this._scholars
      .filter((scholar) => (this.isScholarWithNote ? (scholar.note || scholar.editing) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  onToggle() {
    this.isScholarWithNote = !this.isScholarWithNote;
  }

  onEdit(index: number) {
    this.scholars[index].editing = true;
    this.scholars[index].expanded = true;
  }

  onDiscard(index: number) {
    this.scholars[index].editing = false;
  }

  async onSave(index: number) {
    this.scholars[index].editing = false;

    const scholar = this.scholars[index];

    const uid = this.user.tableID.getValue();
    const scholarID = scholar.id;

    if (uid && scholarID) {
      const note = scholar.note;
      const userDocument = await this.db
        .collection('users')
        .doc(uid)
        .get()
        .toPromise();

      await userDocument.ref.update({
        ['scholars.' + scholarID + '.note']: note,
      });
    }
  }
}
