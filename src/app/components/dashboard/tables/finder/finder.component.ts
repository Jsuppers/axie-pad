import { Component, Input, OnInit } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { lowerCase } from 'lodash';

import { UserService } from 'src/app/services/user/user.service';
import { Axie } from 'src/app/_models/axie';

@Component({
  selector: 'app-finder',
  templateUrl: './finder.component.html',
  styleUrls: ['./finder.component.scss'],
})
export class FinderComponent implements OnInit {
  _axies: Axie[] = [];

  axies: Axie[] = []; // Displaying axies
  searchQuery: string = '';

  @Input()
  hideAddress$: Observable<boolean>;
  hideAddresses: boolean;

  constructor(private user: UserService) {}

  ngOnInit(): void {
    this.user
      .getScholars()
      .pipe(
        switchMap((scholars) => {
          return combineLatest(
            scholars.map((scholar) =>
              this.user.getScholarsAxies(scholar.id).pipe(
                map((result) => {
                  if (result.hasError) {
                    return [];
                  }

                  return result.axies;
                })
              )
            )
          );
        }),
        map((axiesArray) =>
          axiesArray.reduce(
            (result, currentArray) => [...result, ...currentArray],
            []
          )
        )
      )
      .subscribe((axies) => {
        this._axies = axies;
        this.axies = this._axies;
        this.searchQuery = '';
      });

    this.hideAddress$.subscribe((hideAddresses) => {
      this.hideAddresses = hideAddresses;
    });
  }

  getAxieClassColor(axieClass: string) {
    if (!axieClass) {
      return 'grey';
    }
    switch (axieClass.toLowerCase()) {
      case 'plant':
        return 'rgb(108, 192, 0)';
      case 'reptile':
        return 'rgb(220, 139, 228)';
      case 'beast':
        return 'rgb(255, 184, 18)';
      case 'aquatic':
        return 'rgb(0, 184, 206)';
      case 'bird':
        return 'rgb(255, 139, 189)';
      case 'bug':
        return 'rgb(255, 83, 65)';
    }
  }

  onSearchAxies() {
    this.axies = this._axies.filter((axie) =>
      lowerCase(axie.name).includes(lowerCase(this.searchQuery))
    );
  }
}
