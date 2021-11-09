import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user/user.service';
import { FirestoreScholar } from 'src/app/_models/scholar';

@Component({
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.scss'],
})
export class ShareDialogComponent implements OnInit {
  private _uid: string;
  shareLink: string;
  scholars: FirestoreScholar[] = [];

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

  onCopy() {
    navigator.clipboard.writeText(this.shareLink);
    this.snackbar.open('Copied!', undefined, {
      duration: 5000,
    });

    this.router.navigate(['..', 'user', this._uid]);
  }

  async onAdd() {
    const userDocument = await this.db
      .collection('users')
      .doc(this._uid)
      .collection('shared')
      .get()
      .toPromise();

    console.log(userDocument);
  }
}
