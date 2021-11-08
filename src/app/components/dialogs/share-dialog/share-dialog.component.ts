import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user/user.service';
import { FirestoreScholar } from 'src/app/_models/scholar';

@Component({
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.scss'],
})
export class ShareDialogComponent implements OnInit {
  shareLink: string;
  scholars: FirestoreScholar[] = [];

  displayedColumns = ['name', 'team', 'roninAddress', 'actions'];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit() {
    this.shareLink = `https://axiepad.com/#/user/${
      this.authService.userState.getValue().uid
    }`;

    this.userService.getScholars().subscribe((scholars) => {
      console.log(scholars);
      this.scholars = scholars;
    });
  }

  onCopy() {
    navigator.clipboard.writeText(this.shareLink);
    this.snackbar.open('Copied!', undefined, {
      duration: 5000,
    });
  }

  onAdd() {}
}
