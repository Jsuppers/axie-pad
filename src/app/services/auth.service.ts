import { Injectable, NgZone } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import firebase from 'firebase';
import auth = firebase.auth;
import UserCredential = firebase.auth.UserCredential;
import User = firebase.User;

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  userState: User;

  constructor(
    public afs: AngularFirestore,
    public afAuth: AngularFireAuth,
    public router: Router,
    public ngZone: NgZone
  ) {
    this.afAuth.authState.subscribe((user: User) => {
      this.userState = user;
      if (user) {
        this.ngZone.run(() => {
          this.router.navigate(['dashboard']);
        });
      } else {
        this.ngZone.run(() => {
          this.router.navigate(['sign-in']);
        });
      }
    });
  }

  GoogleAuth(): Promise<UserCredential> {
    return this.AuthLogin(new auth.GoogleAuthProvider());
  }

  AuthLogin(provider): Promise<UserCredential> {
    return this.afAuth.signInWithPopup(provider);
  }

  SignOut(): Promise<void> {
    return this.afAuth.signOut().then(() => {
      this.router.navigate(['sign-in']);
    });
  }
}
