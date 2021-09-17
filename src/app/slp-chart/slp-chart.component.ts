import { Component, OnInit } from '@angular/core';
import Chart from 'chart.js';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Label } from 'ng2-charts';
import { UserService } from '../services/user/user.service';
import { combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { SLP } from '../_models/slp';
import { round } from 'lodash';

class ChartData {
  timestamp: number;
  scholarShare: number;
  managerShare: number;
  projectedScholarShare: number;
  projectedManagerShare: number;
  day: string;
}


@Component({
  selector: 'app-slp-chart',
  templateUrl: './slp-chart.component.html',
  styleUrls: ['./slp-chart.component.scss']
})
export class SlpChartComponent implements OnInit {
  days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  public barChartOptions: ChartOptions = {
    responsive: true,
      maintainAspectRatio: false,
    scales: {
      xAxes: [{
        gridLines: {
            display:true,
            color: "#FFFFFF",
            zeroLineColor: '#FFFFFF'
        }, stacked: true }],
      yAxes: [{
        ticks: {
          callback: (value, index) => index % 2 ? null : value
        },
        gridLines: {
            display:false
        }, stacked: true }]
    }
  };
  private managerShareData = [];
  private scholarData = [];
  private projectedScholarData = [];
  private projectedManagerData = [];

  public barChartLabels: Label[][] = [];
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [];
  public barChartData: ChartDataSets[] = [];

  constructor(private userService: UserService) {
    Chart.defaults.global.defaultFontColor = "#fff";
  }

  ngOnInit() {
    this.userService.getScholars().pipe(switchMap((scholars) => {
      const output: Observable<ChartData>[] = [];
      scholars.forEach((scholar) => {
        output.push(
          this.userService.getScholarsSLP(scholar.id).pipe(map((slp) => {
            const timestamp = (slp?.lastClaimed  + (60 * 60 * 24 * 14)) * 1000;
            const day = new Date(timestamp).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
            const managerSharePercentage = (this.userService.getManagerShare(scholar)) / 100;
            let scholarShare = 0;
            let managerShare = 0;
            let projectedShare = 0;
            let projectedScholarShare = 0;
            let projectedManagerShare = 0;

            var chartData: ChartData;
            if (slp?.lastClaimed) {
              scholarShare = slp?.total * (1 - managerSharePercentage);
              managerShare = slp?.total - scholarShare;
              projectedShare = this.getAverageSLP(slp) * this.getDays(slp);
              projectedScholarShare = projectedShare * (1 - managerSharePercentage);
              projectedManagerShare = projectedShare - projectedScholarShare;
              chartData = {
                scholarShare,
                managerShare,
                timestamp,
                projectedScholarShare,
                projectedManagerShare,
                day,
              }
            }
            return chartData;
        })))

      });

      return combineLatest(output);
    })).subscribe((chartdata) => {
      const managerShareDataRecord: Record<number, ChartData> = {};
      chartdata.forEach((data) => {
          if(data) {
            let scholarShare = data.scholarShare;
            let managerShare = data.managerShare;
            let projectedScholarShare = data.projectedScholarShare;
            let projectedManagerShare = data.projectedManagerShare;
            let day = data.day;
            let timestamp = data.timestamp;
            if (managerShareDataRecord[day]) {
              scholarShare += managerShareDataRecord[day].scholarShare;
              managerShare += managerShareDataRecord[day].managerShare;
              projectedScholarShare += managerShareDataRecord[day].projectedScholarShare;
              projectedManagerShare += managerShareDataRecord[day].projectedManagerShare;
            }
            managerShareDataRecord[day] = {
              scholarShare,
              managerShare,
              projectedScholarShare,
              projectedManagerShare,
              timestamp,
              day,
            }
          }
      });

      var sortedValues = Object.values(managerShareDataRecord)
        .sort((a,b) => a.timestamp - b.timestamp);
      this.barChartLabels   = [];
      this.managerShareData = [];
      this.scholarData      = [];
      this.projectedScholarData    = [];
      this.projectedManagerData    = [];
      for (let value of sortedValues) {
        const day = new Date(value.timestamp)
          .toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });

        this.barChartLabels.push([
          day,
          '',
          `$${String(value.managerShare)}`,
          `$${String(value.scholarShare)}`,
          `$${String(round(value.projectedScholarShare, 4))}`,
          `$${String(round(value.projectedManagerShare, 4))}`
        ]);
        this.scholarData.push(value.scholarShare);
        this.managerShareData.push(value.managerShare);
        this.projectedScholarData.push(round(value.projectedScholarShare, 4));
        this.projectedManagerData.push(round(value.projectedManagerShare, 4));
      };

      this.updateChart();
    });
  }

  private updateChart(): void {
    this.barChartData = [
      { data: this.managerShareData, label: "Manager's Share" },
      { data: this.scholarData, label: "Scholars Share" },
      { data: this.projectedScholarData, label: "Scholar Projected" },
      { data: this.projectedManagerData, label: "Manager Projected" },
    ];

  }

  getAverageSLP(slp: SLP, dateNow: Date = new Date()): number {
    if (isNaN(slp?.inProgress)) {
      return 0;
    }
    const inProgressSLP = slp.inProgress;
    const dateClaimed: Date = new Date(slp.lastClaimed * 1000);

    const seconds = Math.floor((dateNow.getTime() - dateClaimed.getTime()) / 1000);
    const secondsInDay = 86400;
    if (seconds < secondsInDay) {
      return inProgressSLP;
    }
    return (inProgressSLP / seconds * secondsInDay);
  }

  getDays(slp: SLP): number {
    if (!slp?.lastClaimed) {
      return 0;
    }
    const dateFuture: any = new Date(((slp.lastClaimed + (60 * 60 * 24 * 14)) * 1000));
    const dateNow: any = new Date();
    if (dateFuture < dateNow) {
      return 0;
    }

    const seconds = Math.floor((dateFuture - (dateNow)) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return days;
  }
}
