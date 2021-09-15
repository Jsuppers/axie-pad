import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user/user.service';
import { MatPaginator } from '@angular/material/paginator';
import { map, switchMap } from 'rxjs/operators';
import { FirestoreScholar } from 'src/app/_models/scholar';
import { LeaderboardDetails } from 'src/app/_models/leaderboard';
import { isEqual, isEmpty, round } from 'lodash';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { DialogService } from 'src/app/services/dialog.service';

export interface TableArenaData {
  id: string;
  name: string;
  draws: number;
  elo: number;
  loses: number;
  rank: number;
  wins: number;
  roninAddress: string;
  expanded: boolean;
  group: string;
  scholar: FirestoreScholar;
  hasError: boolean;
}

const noGroupText = '😥 no group';

class Group {
  rank = 0;
  elo = 0;
  wins = 0;
  draws = 0;
  loses = 0;
  level = 0;
  isGroup = true;
  group: string = noGroupText;
  expanded = false;
  totalCounts = 0;
  hasError = false;
}

@Component({
  selector: 'app-arena-table',
  templateUrl: './arena-table.component.html',
  styleUrls: ['./arena-table.component.scss'],

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
export class ArenaTableComponent implements OnInit {
  displayedColumns: string[] = [
    'position',
    'name',
    'rank',
    'elo',
    'wins',
    'draws',
    'loses',
    'menu',
  ];
  dataSource = new MatTableDataSource<any | TableArenaData>([]);
  groupByColumns: string[] = [];
  @Input()
  hideAddress$: Observable<boolean>;
  hideAddresses: boolean;
  allData: TableArenaData[];
  _allGroup: Group[];
  _numberOfGroups = 0;
  resultsLength = 0;

  @ViewChild(MatSort) sort: MatSort;

  expandedCar: any[] = [];
  expandedSubCar: TableArenaData[] = [];
  scholarTableData: Record<string, BehaviorSubject<TableArenaData>> = {};

  @Input('error')
  tableError = false;
  @Output('errorChange')
  tableErrorChange = new EventEmitter<boolean>();

  constructor(
    public dialog: MatDialog,
    private user: UserService,
    private dialogService: DialogService
  ) {
    this.groupByColumns = ['group'];
  }

  ngOnInit(): void {
    this.user
      .getScholars()
      .pipe(
        switchMap((scholars) => {
          this.allData = [];
          this.scholarTableData = {};
          const output: Observable<TableArenaData>[] = [];
          scholars.forEach((scholar) => {
            output.push(
              this.user.getScholarsLeaderboardDetails(scholar.id).pipe(
                map((leaderboardDetails) => {
                  const index = this.allData.findIndex(
                    (value) => value.id === scholar.id
                  );
                  const tableData = this.getTableData(
                    scholar,
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
      });

    this.hideAddress$.subscribe((hideAddresses) => {
      this.hideAddresses = hideAddresses;
    });
  }

  navigateToScholar(element: TableArenaData): void {
    window.open(
      'https://marketplace.axieinfinity.com/profile/' +
        element.roninAddress +
        '/axie',
      '_blank'
    );
  }

  getGroups(data: TableArenaData[], groupByColumns: string[]): any[] {
    const rootGroup = new Group();
    rootGroup.expanded = false;
    return this.getGroupList(data, 0, groupByColumns, rootGroup);
  }

  getGroupList(
    data: TableArenaData[],
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

      groups[group].rank += row.rank;
      groups[group].elo += row.elo;
      groups[group].wins += row.wins;
      groups[group].draws += row.draws;
      groups[group].loses += row.loses;
      groups[group].hasError = groups[group].hasError || row.hasError;
    });

    Object.values(groups).forEach((group) => {
      const rowsInGroup = data.filter(
        (row) =>
          group[currentColumn] ===
          (row[currentColumn] ? row[currentColumn] : noGroupText)
      );
      group.totalCounts = rowsInGroup.length;
      group.rank = round(group.rank / group.totalCounts);
      group.elo = round(group.elo / group.totalCounts);
      group.wins = round(group.wins / group.totalCounts);
      group.draws = round(group.draws / group.totalCounts);
      group.loses = round(group.loses / group.totalCounts);
      this.expandedSubCar = [];
    });

    this._allGroup = Object.values(groups).sort((a: Group, b: Group) => {
      return this.compare(
        a.rank + a.elo + a.wins + a.draws + a.loses,
        b.rank + b.elo + b.wins + b.loses,
        true
      );
    });
    return this._allGroup;
  }

  getTableData(
    scholar: FirestoreScholar,
    leaderboardDetails: LeaderboardDetails
  ): TableArenaData {
    this.tableError = this.tableError || leaderboardDetails.hasError;
    this.tableErrorChange.emit(this.tableError);

    return {
      id: scholar.id,
      name: scholar?.name ?? 'unknown',
      rank: leaderboardDetails?.rank,
      elo: leaderboardDetails?.elo,
      wins: leaderboardDetails?.wins,
      loses: leaderboardDetails?.loses,
      draws: leaderboardDetails?.draws,
      roninAddress: scholar?.roninAddress,
      expanded: false,
      group: scholar?.group ? scholar?.group : noGroupText,
      scholar,
      hasError: leaderboardDetails.hasError,
    };
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
      data = data.sort((a: TableArenaData, b: TableArenaData) => {
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

  private compare(a: number, b: number, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  getGroupColor(element: TableArenaData) {
    const color = this.user.currentGroupColors()[element?.group];
    if (color) {
      return '#' + color;
    }
  }

  openEditDialog(data: TableArenaData): void {
    this.dialogService.openEditDialog(data.scholar);
  }

  deleteScholar(data: TableArenaData): void {
    this.dialogService.deleteScholar(data.scholar.id);
  }

  openColorDialog(data: TableArenaData): void {
    this.dialogService.openColorDialog(data.group);
  }

  onRefresh(scholar: FirestoreScholar) {
    this.user.updateLeaderBoardDetails(scholar);
  }
}
