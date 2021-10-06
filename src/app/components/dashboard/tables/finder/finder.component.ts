import { Component, Input, OnInit } from '@angular/core';
import { combineLatest, merge, Observable } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
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
  _classes: string[] = [];

  types: Observable<PartTypes[]>;
  axies: Observable<Axie[]>;
  classes: Observable<string[]>;

  form = this.fb.group({
    searchQuery: [''],
    partQuery: [''],
    classQuery: [''],
    purenessQuery: [undefined],
    maxBreedCountQuery: [undefined],
    qualityQuery: [100],
    selectedParts: this.fb.array([]),
    selectedClasses: this.fb.array([]),
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

        this._classes = axies.reduce<string[]>((classes, currentAxie) => {
          if (
            !classes.find((cl) => cl === currentAxie.class) &&
            currentAxie.class
          ) {
            classes.push(currentAxie.class);
          }

          return classes;
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

    this.classes = merge<string, string[]>(
      this.classQueryControl.valueChanges.pipe(startWith('')),
      this.selectedClassesControl.valueChanges.pipe(startWith([]))
    ).pipe(
      map(() => {
        const classQuery = this.classQueryControl.value as string;
        const selectedClasses = this.selectedClassesControl.value as string[];

        return this._classes.filter(
          (cl) =>
            !selectedClasses.includes(cl) &&
            lowerCase(cl).includes(lowerCase(classQuery))
        );
      })
    );

    this.axies = merge(
      this.searchQueryControl.valueChanges.pipe(startWith('')),
      this.selectedPartsControl.valueChanges.pipe(startWith([])),
      this.selectedClassesControl.valueChanges.pipe(startWith([])),
      this.purenessQueryControl.valueChanges,
      this.maxBreedCountQueryControl.valueChanges,
      this.qualityQueryControl.valueChanges.pipe(startWith(100))
    ).pipe(
      map(() => {
        const searchQuery = this.searchQueryControl.value as string;
        const selectedParts = this.selectedPartsControl.value as string[];
        const selectedClasses = this.selectedClassesControl.value as string[];
        const purenessQuery = this.purenessQueryControl.value as
          | number
          | undefined;
        const maxBreedCountQuery = this.maxBreedCountQueryControl.value as
          | number
          | undefined;
        const qualityQuery = (100 - this.qualityQueryControl.value) as number;

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
          })
          .filter((axie) => {
            if (selectedClasses.length) {
              return selectedClasses.includes(axie.class);
            }

            return true;
          })
          .filter((axie) => {
            if (purenessQuery !== undefined) {
              return axie.pureness === purenessQuery;
            }

            return true;
          })
          .filter((axie) => {
            if (maxBreedCountQuery !== undefined) {
              return axie.breedCount <= maxBreedCountQuery;
            }

            return true;
          })
          .filter((axie) => {
            return axie.quality >= qualityQuery;
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

  get classQueryControl() {
    return this.form.get('classQuery') as FormControl;
  }

  get selectedClassesControl() {
    return this.form.get('selectedClasses') as FormArray;
  }

  get purenessQueryControl() {
    return this.form.get('purenessQuery') as FormControl;
  }

  get maxBreedCountQueryControl() {
    return this.form.get('maxBreedCountQuery') as FormControl;
  }

  get qualityQueryControl() {
    return this.form.get('qualityQuery') as FormControl;
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

  onSelectClass(className: string) {
    this.selectedClassesControl.push(this.fb.control(className));
    this.classQueryControl.setValue('');
  }

  onClearFilter() {
    this.form.patchValue({
      searchQuery: '',
      partQuery: '',
      classQuery: '',
      purenessQuery: undefined,
      maxBreedCountQuery: undefined,
      qualityQuery: 100,
    });

    this.selectedPartsControl.clear();
    this.selectedClassesControl.clear();
  }

  onRemovePart(index: number) {
    this.selectedPartsControl.removeAt(index);
  }

  onRemoveClass(index: number) {
    this.selectedClassesControl.removeAt(index);
  }

  onRemovePureness() {
    this.purenessQueryControl.setValue(undefined);
  }

  onRemoveBreedCount() {
    this.maxBreedCountQueryControl.setValue(undefined);
  }
}
