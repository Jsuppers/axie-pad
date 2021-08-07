import { Component, Input, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { combineLatest, Observable } from 'rxjs';
import { Scholar } from '../../../../_models/scholar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../../services/user.service';
import { map, switchMap } from 'rxjs/operators';
import { DialogService } from 'src/app/services/dialog.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import _ from 'lodash';
import { AverageColorDialogComponent } from 'src/app/components/dialogs/average-color-dialog/average-color-dialog.component';

const noGroupText =  '😥 no group';
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
  totalSLP: number = 0;
	level = 0;
  group: string = noGroupText;
	expanded = false;
	totalCounts = 0;
}
export interface TableEarningsData {
  name: string;
  group: string;
  roninName: string;
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
  scholar: Scholar;
}
@Component({
  selector: 'app-earnings-table',
  templateUrl: './earnings-table.component.html',
  styleUrls: ['./earnings-table.component.scss'],

  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
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

	expandedCar: any[] = [];
	expandedSubCar: TableEarningsData[] = [];

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

	getGroups(data: any[], groupByColumns: string[]): any[] {
		const rootGroup = new Group();
		rootGroup.expanded = false;
		return this.getGroupList(data, 0, groupByColumns, rootGroup);
	}

	getGroupList(data: any[], level: number = 0, groupByColumns: string[], parent: Group): any[] {
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

      const scholarLastClaimed = row.scholar?.slp?.lastClaimed;
      if (scholarLastClaimed && (groups[group].lastClaimed ==  0 || scholarLastClaimed < groups[group].lastClaimed)) {
        groups[group].lastClaimed = scholarLastClaimed;
        groups[group].claimableDate = row.claimableDate;
        groups[group].claimableTime = row.claimableTime;
      }

      debugger;

      groups[group].averageSLPSinceLastClaimed += row?.averageSLPSinceLastClaimed ?? 0;
      groups[group].claimableSLP += row?.claimableSLP ?? 0;
      groups[group].totalSLP += row?.totalSLP ?? 0;
      groups[group].inProgressSLP += row?.inProgressSLP ?? 0;
      groups[group].managersShareSLP += row?.managersShareSLP ?? 0;
    });

		Object.values(groups).forEach(group => {
			const rowsInGroup = data.filter(row => group[currentColumn] === (row[currentColumn] ? row[currentColumn] : noGroupText ));
			group.totalCounts = rowsInGroup.length;
      group.averageSLPSinceLastClaimed = group.averageSLPSinceLastClaimed / group.totalCounts;
      group.averageChipColor = this.getAverageChipColor(group.averageSLPSinceLastClaimed);
			this.expandedSubCar = [];
		});

		this._allGroup = Object.values(groups).sort((a: Group, b: Group) => {
			const isAsc = 'asc';
			return this.compare(a.group, b.group, isAsc);
		});
		return this._allGroup;
	}

	addGroupsNew(allGroup: any[], data: any[], groupByColumns: string[], dataRow: any): any[] {
		const rootGroup = new Group();
		rootGroup.expanded = true;
		return this.getSublevelNew(allGroup, data, 0, groupByColumns, rootGroup, dataRow);
	}

	getSublevelNew(allGroup: any[], data: any[], level: number, groupByColumns: string[], parent: Group, dataRow: any): any[] {
		if (level >= groupByColumns.length) {
			return data;
		}
		const currentColumn = groupByColumns[level];
		let subGroups = [];
		allGroup.forEach(group => {
			const rowsInGroup = data.filter(row => group[currentColumn] === row[currentColumn]);
			group.totalCounts = rowsInGroup.length;

      const dataRowGroup = dataRow.group ? dataRow.group : noGroupText;
			if (group.group == dataRowGroup) {
				group.expanded = dataRow.expanded;
				const subGroup = this.getSublevelNew(allGroup, rowsInGroup, level + 1, groupByColumns, group, noGroupText);
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
		const index = data.findIndex(x => x['level'] == 1);
		if (sort.active && sort.direction !== '') {
			if (index > -1) {
				data.splice(index, 1);
			}
			data = data.sort((a: TableEarningsData, b: TableEarningsData) => {
				const isAsc = sort.direction === 'asc';
				switch (sort.active) {
					case 'claimableDate':
						return this.compare(a.scholar.slp.lastClaimed, b.scholar.slp.lastClaimed, isAsc);
					default:
            return this.compare(a[sort.active], b[sort.active], isAsc);
				}
			});
		}
		this.dataSource.data = this.addGroupsNew(this._allGroup, data, this.groupByColumns, this.expandedCar);
  }

	private compare(a, b, isAsc) {
		return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
	}

	groupHeaderClick(row) {
		if (row.expanded) {
			row.expanded = false;
			this.dataSource.data = this.getGroups(this.allData, this.groupByColumns);
		} else {
			row.expanded = true;
			this.expandedCar = row;
			this.dataSource.data = this.addGroupsNew(this._allGroup, this.allData, this.groupByColumns, row);
		}
	}

  ngOnInit(): void {
    this.user.getScholars().pipe(
      map((scholars) => {
      return (scholars ?? []).sort((a, b) => b?.slp?.inProgress - a?.slp?.inProgress)
    })).pipe(switchMap((scholars) => {
      const output: Observable<Scholar>[] = [];
      scholars.forEach((scholar) => {
        output.push(this.user.getScholar(scholar.id));
      });
      return combineLatest(output);

    })).subscribe((scholars) => {
      const tableData: TableEarningsData[] = [];
      scholars.forEach((scholar, index) => {
        const inProgress = scholar?.slp?.inProgress ?? 0;
        const averageSLP = this.getAverageSLP(scholar);
        const claimableDate = this.getClaimableDateString(scholar);
        tableData.push({
          expanded: false,
          scholar: scholar,
          group: scholar?.group ? scholar?.group : noGroupText,
          roninName: scholar?.roninName ?? 'unknown',
          paidTimes: scholar?.paidTimes ?? 0,
          roninAddress: scholar?.roninAddress,
          inProgressSLP: inProgress,
          managersShareSLP: inProgress * ((scholar?.managerShare ?? 0) / 100),
          managersSharePercentage: (scholar?.managerShare ?? 0),
          claimableDate: claimableDate,
          claimableTime: this.getClaimableTimeString(scholar),
          lastClaimedDate: this.getLastClaimedDate(scholar),
          claimableSLP: claimableDate === claimableNow ? inProgress : 0,
          averageSLPSinceLastClaimed: averageSLP,
          averageChipColor: this.getAverageChipColor(averageSLP),
          totalSLP: scholar?.slp?.total ?? 0,
          name: scholar?.name ?? 'unknown',
        });
      });

      this.allData = tableData;
      const newGroups = this.getGroups(this.allData, this.groupByColumns);
      if (_.isEmpty(this.dataSource.data) || !_.isEqual(newGroups, this.dataSource.data )) {
        this.dataSource.data  = newGroups;
      }

    });
    this.hideAddress$.subscribe((hideAddresses) => {
      this.hideAddresses = hideAddresses;
    });
  }

  expandScholar(element): void {
    element.expanded = !element.expanded;
  }

  getGroupName(element): string {
    const groupName = element[this.groupByColumns[element.level-1]] ;
    return groupName ? groupName : noGroupText;
  }

  openSnackBar(message: string): void {
    this.snackBar.open(message + ' copied', undefined, { duration: 5000 , verticalPosition: 'top'});
  }

  getClaimableDateString(element: Scholar): string {
    if (!element?.slp?.lastClaimed) {
      return 'unknown';
    }
    const dateFuture: any = new Date((element.slp.lastClaimed + (60 * 60 * 24 * 14)) * 1000);
    const dateNow: any = new Date();
    if (dateFuture < dateNow) {
      return claimableNow;
    }

    const seconds = Math.floor((dateFuture - (dateNow)) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let output = '';
    if (days > 0) {
      return days + ' days';
    }
    if (hours > 0) {
      return hours + ' hours';
    }
    if (minutes > 0) {
      return minutes + ' minutes';
    }
    return output;
  }

  getClaimableTimeString(element: Scholar): string {
    if (!element?.slp?.lastClaimed) {
      return 'unknown';
    }
    const claimableDate: any = new Date((element.slp.lastClaimed + (60 * 60 * 24 * 14)) * 1000);
    const now: any = new Date();
    if (claimableDate < now) {
      return '';
    }

    return claimableDate.toLocaleTimeString();
  }

  getLastClaimedDate(element: Scholar): string {
    if (!element?.slp?.lastClaimed) {
      return 'unknown';
    }
    const dateNow: any = new Date();
    const dateLastClaimed: any = new Date(element.slp.lastClaimed * 1000);
    if (dateLastClaimed > dateNow) {
      return 'unknown';
    }

    const seconds = Math.floor((dateNow.getTime() - dateLastClaimed.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const currentHours = (hours - (days * 24));
    if (days > 0) {
      return days + ' days';
    }
    if (currentHours > 0) {
      return currentHours + ' hours';
    }
    return 'just now';
  }

  getAverageSLP(scholar: Scholar, dateNow: Date = new Date()): number {
    if (isNaN(scholar?.slp?.inProgress)) {
      return 0;
    }
    const inProgressSLP = scholar.slp.inProgress;
    const dateClaimed: Date = new Date(scholar.slp.lastClaimed * 1000);

    const seconds = Math.floor((dateNow.getTime() - dateClaimed.getTime()) / 1000);
    const secondsInDay = 86400;
    if (seconds < secondsInDay) {
      return inProgressSLP;
    }
    return (inProgressSLP / seconds * secondsInDay);
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

  openDialog(data: TableEarningsData): void {
    this.sholarService.openDialog({
      ...data.scholar,
    });
  }

  deleteScholar(data: TableEarningsData): void {
    this.sholarService.deleteScholar(data.scholar.id);
  }

  navigateToScholar(roninAddress: string) {
    this.sholarService.navigateToScholar(roninAddress);
  }


  openAverageColorDialog(): void {
    const dialogRef = this.dialog.open(AverageColorDialogComponent, {
      width: '400px'
    });
  }
}
