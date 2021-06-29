import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { DefaultScholar, Scholar } from '../../_models/scholar';
import firebase from 'firebase';
import User = firebase.User;
import { HttpClient } from '@angular/common/http';
import { PollService } from '../../services/poll.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  authService: AuthService;
  user: Observable<User>;
  userDocument: firebase.firestore.DocumentSnapshot<unknown>;
  scholars$: Observable<Scholar[]>;
  totalSLP: number;
  newScholar: BehaviorSubject<Scholar> = new BehaviorSubject<Scholar>(null);
  hideAddress: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private service: AuthService,
              private db: AngularFirestore,
              private pollService: PollService,
  ) {
    this.authService = service;
    this.scholars$ = this.pollService.updatedScholars();
  }

  async ngOnInit(): Promise<void> {
    this.userDocument = await this.db.collection('users').doc(this.service.userState.uid).get().toPromise();
    this.scholars$.subscribe((scholars) => {
      this.setTotal(scholars);
    });
    if (!this.userDocument || !this.userDocument.exists) {
      await this.userDocument.ref.set({
        scholars: {},
        totalSLP: 0,
      }, {merge: true});
    }
    this.db.collection('users').doc(this.service.userState.uid).valueChanges().subscribe(async (user: any) => {
      const scholars = Object.values(user.scholars ?? {}) as Scholar[];
      this.pollService.pollScholars(scholars);
    });
  }

  private setTotal(scholars: Scholar[]): void {
    this.totalSLP = 0;
    scholars.forEach((scholar) => {
      this.totalSLP += scholar.totalSLP ?? 0;
    });
  }

  addNewScholar(): void {
    const newScholar = DefaultScholar();
    this.newScholar.next(newScholar);
  }

  hideAddresses(): void {
    this.hideAddress.next(!this.hideAddress.getValue());
  }

  refresh(): void {
    this.pollService.refresh();
  }
}
