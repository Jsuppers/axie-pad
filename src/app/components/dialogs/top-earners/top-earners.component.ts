import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UserService } from 'src/app/services/user.service';
import { Scholar } from 'src/app/_models/scholar';

@Component({
  selector: 'app-top-earners',
  templateUrl: './top-earners.component.html',
  styleUrls: ['./top-earners.component.scss']
})
export class TopEarnersComponent implements OnInit {
  scholars: {name: string, average: number}[] = [];

  constructor(
    public dialogRef: MatDialogRef<TopEarnersComponent>,
    private userService: UserService,
  ) { }


    async ngOnInit(): Promise<void> {
      this.userService.getScholars().subscribe((scholars) => {
        this.scholars = [];
        scholars.forEach((scholar) => {
          this.scholars.push({
            name: scholar.name,
            average: this.getAverageSLP(scholar) ?? 0,
          })
        });
        this.scholars.sort((a, b) => b.average - a.average);
      });
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

  close(): void {
    this.dialogRef.close();
  }

  sortScholars(): void {
    this.scholars.reverse();
  }

}
