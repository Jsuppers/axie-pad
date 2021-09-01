import { Component, Input, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from 'src/app/services/user/user.service';
import { Axie } from '../../../../_models/axie';
import { MatPaginator } from '@angular/material/paginator';
import { map, switchMap } from 'rxjs/operators';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { FirestoreScholar } from 'src/app/_models/scholar';
import { LeaderboardDetails } from 'src/app/_models/leaderboard';
import { isEqual, isEmpty } from 'lodash';

interface TableData {
  id: string;
  name: string;
  elo: number;
  roninAddress: string;
  axies: Axie[];
  expanded: boolean;
  group: string;
}

const noGroupText = '😥 no group';

class Group {
  totalAxies = 0;
  level = 0;
  isGroup = true;
  group: string = noGroupText;
  expanded = false;
  totalCounts = 0;
}

@Component({
  selector: 'app-axie-table',
  templateUrl: './axie-table.component.html',
  styleUrls: ['./axie-table.component.scss'],

  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class AxieTableComponent implements OnInit {
  displayedColumns: string[] = ['position', 'name', 'axies'];
  dataSource = new MatTableDataSource<any | TableData>([]);
  groupByColumns: string[] = [];
  @Input()
  hideAddress$: Observable<boolean>;
  hideAddresses: boolean;
  allData: TableData[];
  _allGroup: Group[];
  _numberOfGroups = 0;
  resultsLength = 0;

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  expandedCar: any[] = [];
  expandedSubCar: TableData[] = [];
  scholarTableData: Record<string, BehaviorSubject<TableData>> = {};

  constructor(public dialog: MatDialog, private user: UserService) {
    this.groupByColumns = ['group'];
  }

  ngOnInit(): void {
    this.user
      .getScholars()
      .pipe(
        switchMap((scholars) => {
          this.allData = [];
          this.scholarTableData = {};

          const output: Observable<TableData>[] = [];
          scholars.forEach((scholar) => {
            output.push(
              combineLatest([
                this.user.getScholarsAxies(scholar.id),
                this.user.getScholarsLeaderboardDetails(scholar.id),
              ]).pipe(
                map(([axies, leaderboardDetails]) => {
                  const index = this.allData.findIndex(
                    (value) => value.id === scholar.id
                  );
                  const tableData = this.getTableData(
                    scholar,
                    axies,
                    leaderboardDetails
                  );

                  if (index >= 0) {
                    if (!isEqual(this.allData[index], tableData)) {
                      this.allData[index] = {
                        ...tableData,
                      };
                    }
                  } else {
                    this.allData.push(tableData);
                  }

                  const dsIndex = this.dataSource.data.findIndex(
                    (value) => value.id === scholar.id
                  );

                  if (
                    dsIndex >= 0 &&
                    !isEqual(this.dataSource.data[dsIndex], tableData)
                  ) {
                    const expanded = this.dataSource.data[dsIndex].expanded;
                    this.dataSource.data[dsIndex] = {
                      ...tableData,
                      expanded,
                    };

                    this.dataSource.data = this.dataSource.data;
                  }

                  return tableData;
                })
              )
            );
          });
          return combineLatest(output);
        })
      )
      .subscribe((tableData) => {
        const newGroups = this.getGroups(tableData, this.groupByColumns);

        if (
          isEmpty(this.dataSource.data) ||
          newGroups.length != this._numberOfGroups
        ) {
          this._numberOfGroups = newGroups.length;
          this.dataSource.data = newGroups;
        } else {
          newGroups.forEach((group) => {
            if (group.isGroup) {
              const dsIndex = this.dataSource.data.findIndex(
                (value) => value?.group === group.group && value?.isGroup
              );
              if (
                dsIndex >= 0 &&
                !isEqual(this.dataSource.data[dsIndex], group)
              ) {
                const expanded = this.dataSource.data[dsIndex].expanded;
                this.dataSource.data[dsIndex] = {
                  ...group,
                  expanded,
                };
              }
            }
          });
        }

        this.dataSource.data = this.dataSource.data;
        this.resultsLength = newGroups.length;
        this.dataSource.paginator = this.paginator;
      });
  }

  navigateToScholar(element: TableData): void {
    window.open(
      'https://marketplace.axieinfinity.com/profile/' +
        element.roninAddress +
        '/axie',
      '_blank'
    );
  }

  navigateToAxie(id: string): void {
    window.open('https://marketplace.axieinfinity.com/axie/' + id, '_blank');
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

  getTableData(
    scholar: FirestoreScholar,
    axies: Axie[],
    leaderboardDetails: LeaderboardDetails
  ): TableData {
    return {
      id: scholar.id,
      name: scholar?.name ?? 'unknown',
      roninAddress: scholar?.roninAddress,
      axies: axies,
      elo: leaderboardDetails?.elo ?? 0,
      expanded: false,
      group: scholar?.group ? scholar?.group : noGroupText,
    };
  }

  getGroups(data: TableData[], groupByColumns: string[]): any[] {
    const rootGroup = new Group();
    rootGroup.expanded = false;
    return this.getGroupList(data, 0, groupByColumns, rootGroup);
  }

  getGroupList(
    data: TableData[],
    level: number = 0,
    groupByColumns: string[],
    parent: Group
  ): any[] {
    if (level >= groupByColumns.length) {
      return data;
    }

    let groups: Record<string, Group> = {};
    const currentColumn = groupByColumns[level];

    data.forEach((row) => {
      const group = row?.group ? row.group : noGroupText;

      if (!groups[group]) {
        const result = new Group();
        result.level = level + 1;
        result.group = group;
        groups[group] = result;
      }

      groups[group].totalAxies += row.axies.length;
    });

    Object.values(groups).forEach((group) => {
      const rowsInGroup = data.filter(
        (row) =>
          group[currentColumn] ===
          (row[currentColumn] ? row[currentColumn] : noGroupText)
      );
      group.totalCounts = rowsInGroup.length;
      this.expandedSubCar = [];
    });

    this._allGroup = Object.values(groups).sort((a: Group, b: Group) => {
      return this.compare(a.totalAxies, b.totalAxies, true);
    });
    return this._allGroup;
  }

  private compare(a: number, b: number, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  isGroup(item): boolean {
    return item?.level;
  }

  isNotGroup(item): boolean {
    return !item?.level;
  }

  isGroupCell(index, item): boolean {
    return item?.level;
  }

  isNotGroupCell(index, item): boolean {
    return !item?.level;
  }

  getSublevelNew(
    allGroup: any[],
    data: any[],
    level: number,
    groupByColumns: string[],
    parent: Group,
    dataRow: any
  ): any[] {
    if (level >= groupByColumns.length) {
      return data;
    }
    const currentColumn = groupByColumns[level];
    let subGroups = [];
    allGroup.forEach((group) => {
      const rowsInGroup = data.filter(
        (row) => group[currentColumn] === row[currentColumn]
      );
      group.totalCounts = rowsInGroup.length;

      const dataRowGroup = dataRow.group ? dataRow.group : noGroupText;
      if (group.group == dataRowGroup) {
        group.expanded = dataRow.expanded;
        const subGroup = this.getSublevelNew(
          allGroup,
          rowsInGroup,
          level + 1,
          groupByColumns,
          group,
          noGroupText
        );
        this.expandedSubCar = subGroup;
        subGroup.unshift(group);
        subGroups = subGroups.concat(subGroup);
      } else {
        subGroups = subGroups.concat(group);
      }
    });
    return subGroups;
  }

  addGroupsNew(
    allGroup: any[],
    data: any[],
    groupByColumns: string[],
    dataRow: any
  ): any[] {
    const rootGroup = new Group();
    rootGroup.expanded = true;
    return this.getSublevelNew(
      allGroup,
      data,
      0,
      groupByColumns,
      rootGroup,
      dataRow
    );
  }

  groupHeaderClick(row) {
    if (row.expanded) {
      row.expanded = false;
      this.dataSource.data = this.dataSource.data.filter(
        (value: any) => value?.isGroup
      );
    } else {
      row.expanded = true;
      this.expandedCar = row;
      this.dataSource.data = this.addGroupsNew(
        this._allGroup,
        this.allData,
        this.groupByColumns,
        row
      );
    }
  }

  expandScholar(element): void {
    element.expanded = !element.expanded;
  }

  getGroupName(element): string {
    const groupName = element[this.groupByColumns[element.level - 1]];
    return groupName ? groupName : noGroupText;
  }

  onSortData(sort: MatSort) {
    let data = this.allData;
    const index = data.findIndex((x) => x['level'] == 1);
    if (sort.active && sort.direction !== '') {
      if (index > -1) {
        data.splice(index, 1);
      }
      data = data.sort((a: TableData, b: TableData) => {
        const isAsc = sort.direction === 'asc';

        return this.compare(a[sort.active], b[sort.active], isAsc);
      });

      this._allGroup = this._allGroup.sort((a: Group, b: Group) => {
        const isAsc = sort.direction === 'asc';

        return this.compare(a[sort.active], b[sort.active], isAsc);
      });
    }
    this.dataSource.data = this.addGroupsNew(
      this._allGroup,
      data,
      this.groupByColumns,
      this.expandedCar
    );
  }

  getGroupColor(element: TableData) {
    const color = this.user.currentGroupColors()[element?.group];
    if (color) {
      return '#' + color;
    }
  }
}
