import { Injectable } from '@angular/core';
import { Scholar } from '../_models/scholar';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PollService {
  private scholars$: BehaviorSubject<Scholar[]> = new BehaviorSubject<Scholar[]>([]);

  constructor(
    private http: HttpClient,
  ) {
    this.listenForScholars();
  }

  private listenForScholars(): void {
    this.scholars$.pipe()
      .subscribe(async (scholars) => {
        for (const scholar of scholars) {
          await this.updateData(scholar);
        }
      });
  }

  refresh(): void {
    this.scholars$.next(this.scholars$.getValue());
  }

  pollScholars(scholars: Scholar[]): void {
    this.scholars$.next(scholars);
  }

  private async updateData(scholar: Scholar): Promise<void> {
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
    return;
  }

}
