import { Component, Input, OnInit } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { lowerCase } from 'lodash';
import { FormBuilder } from '@angular/forms';

import { UserService } from 'src/app/services/user/user.service';
import { Axie } from 'src/app/_models/axie';
import { AxiePart } from 'src/app/_models/part';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
  selector: 'app-finder',
  templateUrl: './finder.component.html',
  styleUrls: ['./finder.component.scss'],
})
export class FinderComponent implements OnInit {
  _axies: Axie[] = [];
  _parts: AxiePart[] = [];

  searchQuery: string = '';
  partQuery: string = '';
  partSelected: AxiePart;

  @Input()
  hideAddress$: Observable<boolean>;
  hideAddresses: boolean;

  constructor(private fb: FormBuilder, private user: UserService) {}

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
        this._parts = axies.reduce((parts, currentAxie) => {
          currentAxie.parts.forEach((part) => {
            const alreadyAdded = Boolean(
              parts.find((_part) => _part.name === part.name)
            );

            if (!alreadyAdded) {
              parts.push(part);
            }
          });

          return parts;
        }, []);
        this.onClearFilter();
      });

    this.hideAddress$.subscribe((hideAddresses) => {
      this.hideAddresses = hideAddresses;
    });
  }

  get filteredParts(): AxiePart[] {
    return this._parts.filter((part) =>
      lowerCase(part.name).includes(lowerCase(this.partQuery))
    );
  }

  get filteredAxies(): Axie[] {
    return this._axies
      .filter((axie) =>
        lowerCase(axie.name).includes(lowerCase(this.searchQuery))
      )
      .filter((axie) => {
        if (!this.partSelected) {
          return true;
        }

        return Boolean(
          axie.parts.find((part) => part.name === this.partSelected.name)
        );
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

  displayFn(part: AxiePart): string {
    return part && part.name ? part.name : '';
  }

  onSelectPart(event: MatAutocompleteSelectedEvent) {
    this.partSelected = event.option.value;
  }

  onClearFilter() {
    this.partSelected = undefined;
    this.searchQuery = '';
    this.partQuery = '';
  }
}
