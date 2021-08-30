import { Component, Input, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { combineLatest, Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from 'src/app/services/user/user.service';
import { Axie } from '../../../../_models/axie';
import { MatPaginator } from '@angular/material/paginator';
import { map, switchMap } from 'rxjs/operators';

interface TableData {
  name: string;
  elo: number;
  roninAddress: string;
  axies: Axie[];
}

@Component({
  selector: 'app-axie-table',
  templateUrl: './axie-table.component.html',
  styleUrls: ['./axie-table.component.scss']
})
export class AxieTableComponent implements OnInit {
  displayedColumns: string[] = [
    'name',
    'axies',
  ];
  dataSource: MatTableDataSource<TableData>;
  @Input()
  hideAddress$: Observable<boolean>;
  hideAddresses: boolean;
  resultsLength = 0;

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    public dialog: MatDialog,
    private user: UserService,
  ) {
  }

  ngOnInit(): void {
    this.user
      .getScholars()
      .pipe(
        switchMap((scholars) => {
          const output: Observable<TableData>[] = [];
          scholars.forEach((scholar) => {
            output.push(
              combineLatest([
                this.user.getScholarsAxies(scholar.id),
                this.user.getScholarsLeaderboardDetails(scholar.id),
              ]).pipe(
                map(([axies, leaderboardDetails]) => {
                  return {
                    name: scholar?.name ?? 'unknown',
                    roninAddress: scholar?.roninAddress,
                    axies: axies,
                    elo: leaderboardDetails?.elo ?? 0,
                  };
              }))
          );
        });
        return combineLatest(output);
      })).subscribe((tableData) => {
        this.dataSource = new MatTableDataSource(tableData);
        this.dataSource.sort = this.sort;
        this.resultsLength = tableData.length;
        this.dataSource.paginator = this.paginator;
      });
  }

  navigateToScholar(element: TableData): void {
    window.open('https://marketplace.axieinfinity.com/profile/' + element.roninAddress + '/axie', '_blank');
  }


  navigateToAxie(id: string): void {
    window.open('https://marketplace.axieinfinity.com/axie/' + id, '_blank');
  }

  getAxieClassColor(axieClass: string) {
    if (!axieClass) {
      return "grey";
    }
    switch(axieClass.toLowerCase()) {
      case "plant":
        return "rgb(108, 192, 0)";
      case "reptile":
        return "rgb(220, 139, 228)";
      case "beast":
        return "rgb(255, 184, 18)";
      case "aquatic":
        return "rgb(0, 184, 206)";
      case "bird":
        return "rgb(255, 139, 189)";
      case "bug":
        return "rgb(255, 83, 65)";
    }
  }
}
