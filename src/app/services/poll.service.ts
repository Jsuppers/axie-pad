import { Injectable } from '@angular/core';
import { Scholar } from '../_models/scholar';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';

@Injectable({
  providedIn: 'root'
})
export class PollService {
  private scholars$: BehaviorSubject<Scholar[]> = new BehaviorSubject<Scholar[]>([]);
  private updatedScholars$: BehaviorSubject<Scholar[]> = new BehaviorSubject<Scholar[]>([]);

  constructor(
    private http: HttpClient,
  ) {
    this.listenForScholars();
  }

  listenForScholars(): void {
    this.scholars$.pipe(switchMap((scholars) => {
      const output: Observable<Scholar>[] = [];
      for (const scholar of scholars) {
        output.push(fromPromise(this.updateData(scholar)));
      }
      return combineLatest(output);
    })).subscribe((scholars) => this.updatedScholars$.next(scholars));
  }

  updatedScholars(): Observable<Scholar[]> {
    return this.updatedScholars$.asObservable();
  }

  refresh(): void {
    this.scholars$.next(this.scholars$.getValue());
  }

  pollScholars(scholars: Scholar[]): void {
    this.scholars$.next(scholars);
  }

  private async updateData(scholar: Scholar): Promise<Scholar> {
    if (!scholar.accountEthAddress) {
      return;
    }
    try {
      // TODO poll again every x seconds
      const url = 'https://lunacia.skymavis.com/game-api/clients/' + scholar.accountEthAddress + '/items/1';
      const output = await this.http.get<any>(url).toPromise();
      if (output ) {
        scholar.totalSLP = output.total;
        scholar.claimableSLP = output.claimable_total;
        scholar.lastClaimed = output.last_claimed_item_at;
      }
    } catch (e) {
      console.log(e);
    }
    return scholar;
  }

}
