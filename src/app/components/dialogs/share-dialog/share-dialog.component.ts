import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user/user.service';
import { FirestoreScholar } from 'src/app/_models/scholar';
import { DefaultSharedConfig } from 'src/app/_models/shared';

@Component({
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.scss'],
})
export class ShareDialogComponent implements OnInit {
  private _uid: string;
  shareLink: string;
  scholars: FirestoreScholar[] = [];
  private scholarsToShare: string[] = [];

  displayedColumns = ['name', 'team', 'roninAddress', 'actions'];

  constructor(
    private userService: UserService,
    private snackbar: MatSnackBar,
    private db: AngularFirestore,
    private router: Router,
  ) {}

  ngOnInit() {
    this._uid = this.userService.tableID.getValue();
    this.shareLink = `https://axiepad.com/#/user/${this._uid}`;

    this.userService.getScholars().subscribe((scholars) => {
      this.scholars = scholars;
    });
  }

  async onCopy() {
    const userDocument = await this.db
      .collection('users')
      .doc(this._uid)
      .collection('shared')
      .doc(this._uid)
      .get()
      .toPromise();

    if (!userDocument || !userDocument.exists) {
      const config = DefaultSharedConfig();
      config.scholars = this.scholarsToShare;
      await userDocument.ref.set(
        config,
      );
    } else {
      await userDocument.ref.update(
        {
          scholars: this.scholarsToShare,
        },
      );
    }
  }

  showCopyMessage(): void {
    navigator.clipboard.writeText(this.shareLink);
    this.snackbar.open('Copied!', undefined, {
      duration: 5000,
    });
  }

  async onAdd() {
    // TODO add scholar
    // this.scholarsToShare.push(scholarAddress)
  }

  async onAddAll() {
    this.scholars.forEach((scholar) => {
      this.scholarsToShare.push(scholar.roninAddress);
    })
  }

  async stopSharing() {
    const userDocument = await this.db
      .collection('users')
      .doc(this._uid)
      .collection('shared')
      .doc(this._uid)
      .get()
      .toPromise();

    if (!userDocument || !userDocument.exists) {
      const config = DefaultSharedConfig();
      config.scholars = [];
      await userDocument.ref.set(
        config,
      );
    } else {
      await userDocument.ref.update(
        {
          scholars: [],
        },
      );
    }

  }
}
