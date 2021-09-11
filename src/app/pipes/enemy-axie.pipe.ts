import { Pipe, PipeTransform } from '@angular/core';
import { Fighter } from '../_models/battle';

@Pipe({
  name: 'enemyAxie'
})
export class EnemyAxiePipe implements PipeTransform {
  transform(fighters: Fighter[]): any {
    return fighters.filter(fighter => fighter.ownTeam == false);
 }
}
