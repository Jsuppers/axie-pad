import { Injectable } from '@angular/core';
import { Scholar } from '../_models/scholar';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { distinctUntilChanged } from 'rxjs/operators';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class PollService {
  private scholars$: BehaviorSubject<Scholar[]> = new BehaviorSubject<Scholar[]>([]);

  constructor(
    private http: HttpClient,
    private db: AngularFirestore,
    private authService: AuthService,
  ) {
    this.listenForScholars();
  }

  private listenForScholars(): void {
    this.scholars$.pipe()
      .subscribe((scholars) => {
        debugger;
        scholars.forEach((scholar) => {
          this.updateData(scholar);
        });
      });
  }

  refresh(): void {
    this.scholars$.next(this.scholars$.getValue());
  }

  pollScholars(scholars: Scholar[]): void {
    this.scholars$.next(scholars);
  }

  private async updateData(scholar: Scholar): Promise<void> {
    if (!scholar.roninAddress) {
      return;
    }
    try {
      const skyMavisAddress = scholar.roninAddress.replace('ronin:', '0x');
      const url = 'https://lunacia.skymavis.com/game-api/clients/' + skyMavisAddress + '/items/1';
      const output = await this.http.get<any>(url).toPromise();
      if (output && output.total !== scholar.totalSLP) {
        const userDocument = await this.db.collection('users').doc(this.authService.userState.uid).get().toPromise();
        await userDocument.ref.update({
          ['scholars.' + scholar.id + '.totalSLP']: output.total,
        });
      }
    } catch (e) {
      console.log(e);
    }
    return;
  }

}
