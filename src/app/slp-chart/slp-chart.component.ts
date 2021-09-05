import { Component, OnInit } from '@angular/core';
import Chart from 'chart.js';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Label } from 'ng2-charts';
import { UserService } from '../services/user/user.service';
import { combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { SLP } from '../_models/slp';


class ChartData {
  timestamp: number;
  scholarShare: number;
  managerShare: number;
  projectedShare: number;
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
        gridLines: {
            display:false
        }, stacked: true }]
    }
  };
  private managerShareData = [];
  private scholarData = [];
  private projectedData = [];

  public barChartLabels: Label[] = [];
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
            const day = new Date(timestamp).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric' });
            const managerSharePercentage = (this.userService.getManagerShare(scholar)) / 100;
            let scholarShare = 0;
            let managerShare = 0;
            let projectedShare = 0;

            var chartData: ChartData;
            if (slp?.lastClaimed) {
              scholarShare = slp?.total * (1 - managerSharePercentage);
              managerShare = slp?.total - scholarShare;
              projectedShare = this.getAverageSLP(slp) * this.getDays(slp);
              chartData = {
                scholarShare,
                managerShare,
                projectedShare,
                timestamp,
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
            let projectedShare = data.projectedShare;
            let day = data.day;
            let timestamp = data.timestamp;
            if (managerShareDataRecord[day]) {
              scholarShare += managerShareDataRecord[day].scholarShare;
              managerShare += managerShareDataRecord[day].managerShare;
              projectedShare += managerShareDataRecord[day].projectedShare;
            }
            managerShareDataRecord[day] = {
              scholarShare,
              managerShare,
              projectedShare,
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
      this.projectedData    = [];
      for (let value of sortedValues) {
        const day = new Date(value.timestamp)
          .toLocaleDateString(undefined, { weekday: 'long', day: 'numeric' });

        this.barChartLabels.push(day);
        this.scholarData.push(value.scholarShare);
        this.managerShareData.push(value.managerShare);
        this.projectedData.push(value.projectedShare);
      };

      this.updateChart();
    });
  }

  private updateChart(): void {
    this.barChartData = [
      { data: this.managerShareData, label: "Manager's Share" },
      { data: this.scholarData, label: "Scholars Share" },
      { data: this.projectedData, label: "Projected" },
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
