import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, switchMap } from 'rxjs/operators';
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
    private db: AngularFirestore
  ) {}

  ngOnInit() {
    this._uid = this.userService.tableID.getValue();
    this.shareLink = `https://axiepad.com/#/user/${this._uid}`;

    this.db
      .collection('users')
      .doc(this._uid)
      .collection('shared')
      .doc(this._uid)
      .valueChanges()
      .pipe(
        switchMap((config) =>
          this.userService.getScholars().pipe(
            map((scholars) => {
              return [config, scholars];
            })
          )
        )
      )
      .subscribe(([config, scholars]) => {
        this.scholars = scholars as FirestoreScholar[];

        if (config) {
          this.scholarsToShare = config.scholars;
        }
      });
  }

  async onShare() {
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
      await userDocument.ref.set(config);
    } else {
      await userDocument.ref.update({
        scholars: this.scholarsToShare,
      });
    }

    this.snackbar.open('Saved scholars to share!', undefined, {
      duration: 5000,
    });
  }

  showCopyMessage(): void {
    navigator.clipboard.writeText(this.shareLink);
    this.snackbar.open('Copied!', undefined, {
      duration: 5000,
    });
  }

  onAdd(scholarAddress: string) {
    this.scholarsToShare.push(scholarAddress);
  }

  async onAddAll() {
    this.scholars.forEach((scholar) => {
      this.scholarsToShare.push(scholar.roninAddress);
    });
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
      await userDocument.ref.set(config);
    } else {
      await userDocument.ref.update({
        scholars: [],
      });
    }

    this.snackbar.open('Stopped sharing!', undefined, {
      duration: 5000,
    });
  }

  isSharing(scholarAddress: string) {
    return Boolean(
      this.scholarsToShare.find((address) => address === scholarAddress)
    );
  }

  onRemove(scholarAddress: string) {
    this.scholarsToShare = this.scholarsToShare.filter(
      (address) => address !== scholarAddress
    );
  }
}
