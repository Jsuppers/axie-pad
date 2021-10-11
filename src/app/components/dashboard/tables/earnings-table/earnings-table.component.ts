import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, combineLatest, Observable, throwError } from 'rxjs';
import { FirestoreScholar } from '../../../../_models/scholar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../../services/user/user.service';
import { catchError, map, switchMap } from 'rxjs/operators';
import { DialogService } from 'src/app/services/dialog.service';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import _, { isEqual } from 'lodash';
import { AverageColorDialogComponent } from 'src/app/components/dialogs/average-color-dialog/average-color-dialog.component';
import { SLP } from 'src/app/_models/slp';
import { RuleType, SLPRule } from 'src/app/_models/rule';

const noGroupText = '😥 no group';
const claimableNow = 'now';
export class Group {
  // this will be the earlist claim date from within this group
  claimableDate: string;
  claimableTime: string;
  lastClaimed: number = 0;
  averageSLPSinceLastClaimed: number = 0;
  averageChipColor: string;
  managersShareSLP: number = 0;
  inProgressSLP: number = 0;
  claimableSLP: number = 0;
  hasFailedSLPRules: boolean = false;
  totalSLP: number = 0;
  level = 0;
  isGroup = true;
  group: string = noGroupText;
  expanded = false;
  totalCounts = 0;
  hasError = false;
}
export interface TableEarningsData {
  name: string;
  group: string;
  roninName: string;
  failedRules: SLPRule[];
  expanded: boolean;
  roninAddress: string;
  averageSLPSinceLastClaimed: number;
  averageChipColor: string;
  inProgressSLP: number;
  managersShareSLP: number;
  managersSharePercentage: number;
  claimableSLP: number;
  totalSLP: number;
  claimableDate: string;
  claimableTime: string;
  lastClaimedDate: string;
  paidTimes: number;
  scholar: FirestoreScholar;
  slp: SLP;
  hasError: boolean;
}
@Component({
  selector: 'app-earnings-table',
  templateUrl: './earnings-table.component.html',
  styleUrls: ['./earnings-table.component.scss'],

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
export class EarningsTableComponent implements OnInit {
  public dataSource = new MatTableDataSource<any | TableEarningsData>([]);
  groupByColumns: string[] = [];
  displayedColumns: string[] = [
    'position',
    'name',
    'claimableDate',
    'averageSLPSinceLastClaimed',
    'inProgressSLP',
    'managersShareSLP',
    'claimableSLP',
    'actions',
    'menu',
  ];
  headerColumns: string[] = [];
  @Input()
  hideAddress$: Observable<boolean>;
  hideAddresses: boolean;
  allData: any[];
  _allGroup: any[];
  _numberOfGroups = 0;

  expandedCar: any[] = [];
  expandedSubCar: TableEarningsData[] = [];
  scholarTableData: Record<string, BehaviorSubject<TableEarningsData>> = {};
  expandingScholar: TableEarningsData = undefined;

  @Input('error')
  tableError = false;
  @Output('errorChange')
  tableErrorChange = new EventEmitter<boolean>();

  @Input() searchQuery: BehaviorSubject<string>;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    public dialog: MatDialog,
    private user: UserService,
    private snackBar: MatSnackBar,
    private sholarService: DialogService,
  ) {
    this.groupByColumns = ['group'];
    this.headerColumns = this.displayedColumns;
  }

  getTableData(
      scholar: FirestoreScholar,
      slp: SLP,
      failedRules: SLPRule[],
      ): TableEarningsData {

    const inProgress = slp?.inProgress ?? 0;
    const averageSLP = this.getAverageSLP(slp);
    const claimableDate = this.getClaimableDateString(slp);

    this.tableError = this.tableError || slp.hasError;
    this.tableErrorChange.emit(this.tableError);

    return {
      expanded: this.expandingScholar ? scholar.id === this.expandingScholar.scholar.id : false,
      scholar: scholar,
      failedRules: failedRules,
      group: scholar?.group ? scholar?.group : noGroupText,
      roninName: this.user.getRoninName(scholar.roninAddress),
      paidTimes: scholar?.paidTimes ?? 0,
      roninAddress: scholar?.roninAddress,
      inProgressSLP: inProgress,
      managersShareSLP: inProgress * ((this.user.getManagerShare(scholar) ?? 0) / 100),
      managersSharePercentage: this.user.getManagerShare(scholar) ?? 0,
      claimableDate: claimableDate,
      claimableTime: this.getClaimableTimeString(slp),
      lastClaimedDate: this.getLastClaimedDate(slp),
      claimableSLP: claimableDate === claimableNow ? inProgress : 0,
      averageSLPSinceLastClaimed: averageSLP,
      averageChipColor: this.getAverageChipColor(averageSLP),
      totalSLP: slp?.total ?? 0,
      name: scholar?.name ?? 'unknown',
      slp: slp,
      hasError: slp.hasError
    };
  }

  ngOnInit(): void {
    combineLatest([this.user.getScholars(), this.user.currentUser$()]).pipe(
        switchMap(([scholars, user]) => {
          this.allData = [];
          this.scholarTableData = {};
          const output: Observable<TableEarningsData>[] = [];
          scholars.forEach((scholar) => {
            output.push(
               this.user.getScholarsSLP(scholar.id).pipe(map((slp) => {
                const failedRules: SLPRule[] = [];
                const averageSLP = this.getAverageSLP(slp);
                Object.values(user?.notificationRules ?? {}).forEach((rule) => {
                  if (rule.type === RuleType.slpCount) {
                    if (averageSLP < (rule as SLPRule).lessThan) {
                      failedRules.push(rule as SLPRule);
                    }
                  }
                });

                const index = this.allData.findIndex((value) => value?.scholar?.id === scholar.id);
                const tableData = this.getTableData(scholar, slp, failedRules);
                if (index >= 0) {
                  if (!isEqual(this.allData[index], tableData)) {
                    this.allData[index] = {
                      ...tableData
                    };
                  }
                } else {
                  this.allData.push(tableData);
                }
                const dsIndex = this.dataSource.data.findIndex((value) => value?.scholar?.id === scholar.id);
                if (dsIndex >= 0 && !isEqual(this.dataSource.data[dsIndex], tableData)) {
                  const expanded = this.dataSource.data[dsIndex].expanded;
                  this.dataSource.data[dsIndex] = {
                    ...tableData,
                    expanded
                  };

                  // a hack to force the data to refresh
                  this.dataSource.data = this.dataSource.data;
                }
                return tableData;
              }))
            );
          });
          return combineLatest(output);
        }),
      )
      .subscribe((tableData) => {
        const newGroups = this.getGroups(tableData, this.groupByColumns);
        if (
          _.isEmpty(this.dataSource.data) ||
          newGroups.length != this._numberOfGroups
        ) {
          this._numberOfGroups = newGroups.length;
          this.dataSource.data = newGroups;
        } else {
          newGroups.forEach((group) => {
            if(group.isGroup) {
              const dsIndex =
                this.dataSource.data.findIndex((value) => value?.group === group.group && value?.isGroup);
              if (dsIndex >= 0 && !isEqual(this.dataSource.data[dsIndex], group)) {
                const expanded = this.dataSource.data[dsIndex].expanded;
                this.dataSource.data[dsIndex] = {
                  ...group,
                  expanded
                };
              }
            }

          });

          this.sort.active = 'averageSLPSinceLastClaimed';
          this.sort.start = 'desc';
          this.onSortData(this.sort);
        }
      });

    this.hideAddress$.subscribe((hideAddresses) => {
      this.hideAddresses = hideAddresses;
    });

    this.searchQuery.subscribe((query) => {
      if (this.allData && this._allGroup) {
        this.dataSource.data = query.length ? this.allData : this._allGroup;

        this.dataSource.filter = query.trim().toLowerCase();
      }
    });

    this.dataSource.filterPredicate = (data: TableEarningsData | Group, query) => {
      if (query.length) {
        if ((data as Group).isGroup) {
          return false;
        }

        return (
          (data as TableEarningsData).scholar.name
            .toLowerCase()
            .includes(query) ||
          (data as TableEarningsData).scholar.roninAddress
            .toLowerCase()
            .includes(query)
        );
      }

      return true;
    }
  }

  getGroups(data: TableEarningsData[], groupByColumns: string[]): any[] {
    return this.getGroupList(data, 0, groupByColumns);
  }

  getGroupList(
    data: TableEarningsData[],
    level: number = 0,
    groupByColumns: string[],
  ): any[] {
    if (level >= groupByColumns.length) {
      return data;
    }
    let groups: Record<string, Group> = {};
    const currentColumn = groupByColumns[level];
    var hasFailedSLPRules = false;
    data.forEach((row) => {
      const group = row?.group ? row.group : noGroupText;
      if (!groups[group]) {
        const result = new Group();
        result.level = level + 1;
        result.group = group;
        groups[group] = result;
      }
      if (row.failedRules.length > 0) {
        hasFailedSLPRules = true;
        groups[group].hasFailedSLPRules = hasFailedSLPRules;
      }

      const scholarLastClaimed = row?.slp?.lastClaimed;
      if (
        scholarLastClaimed &&
        (groups[group].lastClaimed == 0 ||
          scholarLastClaimed < groups[group].lastClaimed)
      ) {
        groups[group].lastClaimed = scholarLastClaimed;
        groups[group].claimableDate = row.claimableDate;
        groups[group].claimableTime = row.claimableTime;
      }

      groups[group].averageSLPSinceLastClaimed +=
        row?.averageSLPSinceLastClaimed ?? 0;
      groups[group].claimableSLP += row?.claimableSLP ?? 0;
      groups[group].totalSLP += row?.totalSLP ?? 0;
      groups[group].inProgressSLP += row?.inProgressSLP ?? 0;
      groups[group].managersShareSLP += row?.managersShareSLP ?? 0;
      groups[group].hasError = groups[group].hasError || row.hasError;
    });

    Object.values(groups).forEach((group) => {
      const rowsInGroup = data.filter(
        (row) =>
          group[currentColumn] ===
          (row[currentColumn] ? row[currentColumn] : noGroupText)
      );
      group.totalCounts = rowsInGroup.length;
      group.averageSLPSinceLastClaimed =
        group.averageSLPSinceLastClaimed / group.totalCounts;
      group.averageChipColor = this.getAverageChipColor(
        group.averageSLPSinceLastClaimed
      );
      this.expandedSubCar = [];
    });

    this._allGroup = Object.values(groups).sort((a: Group, b: Group) => {
      return this.compare(a.group, b.group, true);
    });
    return this._allGroup;
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

  uniqueBy(a, key) {
    const seen = {};
    return a.filter((item) => {
      const k = key(item);
      return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    });
  }

  isGroup(item): boolean {
    return item?.level;
  }

  isNotGroup(item): boolean {
    return !item?.level;
  }

  isNotGroupCell(index, item): boolean {
    return !item?.level;
  }

  isGroupCell(index, item): boolean {
    return item?.level;
  }

  onSortData(sort: MatSort) {
    let data = this.allData;
    const index = data.findIndex((x) => x['level'] == 1);
    if (sort.active && sort.direction !== '') {
      if (index > -1) {
        data.splice(index, 1);
      }
      data = data.sort((a: TableEarningsData, b: TableEarningsData) => {
        const isAsc = sort.direction === 'asc';
        switch (sort.active) {
          case 'claimableDate':
            return this.compare(
              a.slp.lastClaimed,
              b.slp.lastClaimed,
              isAsc
            );
          default:
            return this.compare(a[sort.active], b[sort.active], isAsc);
        }
      });

      this._allGroup = this._allGroup.sort((a: Group, b: Group) => {
        const isAsc = sort.direction === 'asc';
        switch (sort.active) {
          case 'claimableDate':
            return this.compare(
              a.lastClaimed,
              b.lastClaimed,
              isAsc
            );
          default:
            return this.compare(a[sort.active], b[sort.active], isAsc);
        }
      });
    }
    this.dataSource.data = this.addGroupsNew(
      this._allGroup,
      data,
      this.groupByColumns,
      this.expandedCar
    );
  }

  private compare(a, b, isAsc) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  groupHeaderClick(row) {
    if (row.expanded) {
      row.expanded = false;
      this.dataSource.data = this.dataSource.data.filter((value) => value?.isGroup);
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
    this.expandingScholar = element.expanded ? element : undefined;
  }

  getGroupName(element): string {
    const groupName = element[this.groupByColumns[element.level - 1]];
    return groupName ? groupName : noGroupText;
  }

  openSnackBar(message: string): void {
    this.snackBar.open(message + ' copied', undefined, {
      duration: 5000,
      verticalPosition: 'top',
    });
  }

  getClaimableDateString(slp: SLP): string {
    if (!slp?.lastClaimed) {
      return 'unknown';
    }
    const dateFuture: any = new Date(
      (slp.lastClaimed + 60 * 60 * 24 * 14) * 1000
    );
    const dateNow: any = new Date();
    if (dateFuture < dateNow) {
      return claimableNow;
    }

    const seconds = Math.floor((dateFuture - dateNow) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      if (hours == 0 && minutes > 0) {
        return minutes + ' minutes';
      }
      return hours + ' hours';
    }
    return dateFuture.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  getClaimableTimeString(slp: SLP): string {
    if (!slp?.lastClaimed) {
      return 'unknown';
    }
    const claimableDate: any = new Date(
      (slp.lastClaimed + 60 * 60 * 24 * 14) * 1000
    );
    const now: any = new Date();
    if (claimableDate < now) {
      return '';
    }

    return claimableDate.toLocaleTimeString();
  }

  getLastClaimedDate(slp: SLP): string {
    if (!slp?.lastClaimed) {
      return 'unknown';
    }
    const dateNow: any = new Date();
    const dateLastClaimed: any = new Date(slp.lastClaimed * 1000);
    if (dateLastClaimed > dateNow) {
      return 'unknown';
    }

    const seconds = Math.floor(
      (dateNow.getTime() - dateLastClaimed.getTime()) / 1000
    );
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const currentHours = hours - days * 24;
    if (days > 0) {
      return days + ' days';
    }
    if (currentHours > 0) {
      return currentHours + ' hours';
    }
    return 'just now';
  }

  getAverageSLP(slp: SLP, dateNow: Date = new Date()): number {
    if (isNaN(slp?.inProgress)) {
      return 0;
    }
    const inProgressSLP = slp.inProgress;
    const dateClaimed: Date = new Date(slp.lastClaimed * 1000);

    const seconds = Math.floor(
      (dateNow.getTime() - dateClaimed.getTime()) / 1000
    );
    const secondsInDay = 86400;
    if (seconds < secondsInDay) {
      return inProgressSLP;
    }
    return (inProgressSLP / seconds) * secondsInDay;
  }

  getAverageChipColor(averageSLP: number): string {
    const colors = this.user.currentColors();
    if (Math.round(averageSLP) < colors[0]) {
      return '#FF0000'; // red
    }
    if (Math.round(averageSLP) < colors[1]) {
      return '#FF8000'; // orange
    }
    if (Math.round(averageSLP) < colors[2]) {
      return '#00CC00'; // green
    }
    return '#FF00FF'; // pink
  }

  openPaidDialog(data: TableEarningsData): void {
    this.sholarService.openPayDialog({
      ...data.scholar,
    });
  }

  openEditDialog(data: TableEarningsData): void {
    this.sholarService.openEditDialog(data.scholar);
  }

  openColorDialog(data: any): void {
    this.sholarService.openColorDialog(data.group);
  }

  deleteScholar(data: TableEarningsData): void {
    this.sholarService.deleteScholar(data.scholar.id);
  }

  navigateToScholar(roninAddress: string) {
    this.sholarService.navigateToScholar(roninAddress);
  }

  getGroupColor(element: TableEarningsData) {
    const color = this.user.currentGroupColors()[element?.group];
    if (color) {
      return '#' + color;
    }
  }

  openAverageColorDialog(): void {
    const dialogRef = this.dialog.open(AverageColorDialogComponent, {
      width: '400px',
    });
  }

  onRefresh(scholar: FirestoreScholar) {
    this.user.updateSLP(scholar);
  }
}
