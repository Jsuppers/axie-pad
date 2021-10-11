import { Component } from '@angular/core';
import _ from 'lodash';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { UserService } from 'src/app/services/user/user.service';

@Component({
  selector: 'app-breed-profit-table',
  templateUrl: './breed-profit-table.component.html',
  styleUrls: ['./breed-profit-table.component.scss']
})
export class BreedProfitTableComponent {
  averageValue = 0;
  averageAxiePrice$: BehaviorSubject<number> = new BehaviorSubject(0);
  formulaCost: string[] = new Array<string>(7);
  totalCost: number[] = new Array<number>(7);
  breedingCostSLP: number[] = [
    600,
    900,
    1500,
    2400,
    3900,
    6300,
    10200
  ];
  breedingCostAXS = 1;
  highestProfit = -1;

  constructor(private userService: UserService) {
    combineLatest([
      userService.getSLPPrice(),
      userService.getAXSPrice(),
      this.averageAxiePrice$,
    ])
      .subscribe(([slpPrice, axsPrice, averagePrice]) => {
        this.highestProfit = -1;
        for (let i = 0; i < this.totalCost.length; i++) {
          let totalBreedingtSLP = 0;
          for (let j = 0; j < i + 1; j++) {
            totalBreedingtSLP += this.breedingCostSLP[j];
          }
          const breedCount = (i + 1);
          const totalBreedingCostSLP = totalBreedingtSLP * slpPrice;
          const totalBreedingCostAXS = axsPrice * (this.breedingCostAXS * breedCount);
          const totalBreedingCost = totalBreedingCostSLP + totalBreedingCostAXS;
          this.formulaCost[i] = 'y = ' + (i ? breedCount : '') + 'x - ' + totalBreedingCostSLP.toFixed(2) + ' ( ' + totalBreedingtSLP + ' SLP) - ' + totalBreedingCostAXS.toFixed(2) + ' ( ' + (breedCount * this.breedingCostAXS) +' AXS)';
          this.totalCost[i] = (breedCount * averagePrice) - totalBreedingCost;
          if (this.totalCost[i] > this.highestProfit) {
            this.highestProfit = this.totalCost[i];
          }
        }
      });
  }

  updateAverageValue(): void {
    this.averageAxiePrice$.next(this.averageValue)
  }
}
