import { Component, Input, OnInit } from '@angular/core';
import { combineLatest, merge, Observable } from 'rxjs';
import { map, startWith, switchMap, tap } from 'rxjs/operators';
import { lowerCase } from 'lodash';
import { FormArray, FormBuilder, FormControl } from '@angular/forms';

import { UserService } from 'src/app/services/user/user.service';
import { Axie } from 'src/app/_models/axie';
import { AxiePart } from 'src/app/_models/part';

type PartTypes = {
  name: string;
  parts: AxiePart[];
};

@Component({
  selector: 'app-finder',
  templateUrl: './finder.component.html',
  styleUrls: ['./finder.component.scss'],
})
export class FinderComponent implements OnInit {
  _axies: Axie[] = [];
  _types: PartTypes[] = [];
  _parts: AxiePart[] = [];

  types: Observable<PartTypes[]>;
  axies: Observable<Axie[]>;

  form = this.fb.group({
    searchQuery: [''],
    partQuery: [''],
    selectedParts: this.fb.array([]),
  });

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

        this._parts = axies.reduce<AxiePart[]>((parts, currentAxie) => {
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

        this._types = this._parts.reduce<PartTypes[]>((result, currentPart) => {
          const typeIndex = result.findIndex(
            (type) => type.name === currentPart.type
          );

          if (typeIndex !== -1) {
            result[typeIndex].parts.push(currentPart);
          } else {
            result.push({ name: currentPart.type, parts: [currentPart] });
          }

          return result;
        }, []);

        this.onClearFilter();
      });

    this.hideAddress$.subscribe((hideAddresses) => {
      this.hideAddresses = hideAddresses;
    });

    this.types = merge<string, string[]>(
      this.partQueryControl.valueChanges.pipe(startWith('')),
      this.selectedPartsControl.valueChanges.pipe(startWith([]))
    ).pipe(
      map(() => {
        const partQuery = this.partQueryControl.value as string;
        const selectedParts = this.selectedPartsControl.value as string[];

        return this._types
          .map((type) => ({
            ...type,
            parts: type.parts.filter((part) => {
              const isSelected = Boolean(
                selectedParts.find((selectedPart) => selectedPart === part.name)
              );

              return (
                lowerCase(part.name).includes(lowerCase(partQuery)) &&
                !isSelected
              );
            }),
          }))
          .filter((type) => type.parts.length);
      })
    );

    this.axies = merge<string, string[]>(
      this.searchQueryControl.valueChanges.pipe(startWith('')),
      this.selectedPartsControl.valueChanges.pipe(startWith([]))
    ).pipe(
      map(() => {
        const searchQuery = this.searchQueryControl.value as string;
        const selectedParts = this.selectedPartsControl.value as string[];

        return this._axies
          .filter((axie) =>
            lowerCase(axie.name).includes(lowerCase(searchQuery))
          )
          .filter((axie) => {
            if (selectedParts.length) {
              let count = 0;

              for (let part of selectedParts) {
                if (axie.parts.find((_part) => _part.name === part)) {
                  count++;
                }
              }

              return count === selectedParts.length;
            }

            return true;
          });
      })
    );
  }

  get searchQueryControl() {
    return this.form.get('searchQuery') as FormControl;
  }

  get partQueryControl() {
    return this.form.get('partQuery') as FormControl;
  }

  get selectedPartsControl(): FormArray {
    return this.form.get('selectedParts') as FormArray;
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

  onSelectPart(partName: string) {
    this.selectedPartsControl.push(this.fb.control(partName));
    this.partQueryControl.setValue('');
  }

  onClearFilter() {
    this.form.patchValue({
      searchQuery: '',
      partQuery: '',
    });

    this.selectedPartsControl.clear();
  }

  onRemovePart(index: number) {
    this.selectedPartsControl.removeAt(index);
  }
}
