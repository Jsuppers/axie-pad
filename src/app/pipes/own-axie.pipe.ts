import { Pipe, PipeTransform } from '@angular/core';
import { Fighter } from '../_models/battle';

@Pipe({
  name: 'ownAxie'
})
export class OwnAxiePipe implements PipeTransform {
  transform(fighters: Fighter[]): any {
     return fighters.filter(fighter => fighter.ownTeam == true);
  }
}
