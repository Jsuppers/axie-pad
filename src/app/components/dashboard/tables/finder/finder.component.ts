import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UserService } from 'src/app/services/user/user.service';
import { FirestoreScholar } from 'src/app/_models/scholar';

@Component({
  selector: 'app-finder',
  templateUrl: './finder.component.html',
  styleUrls: ['./finder.component.scss'],
})
export class FinderComponent implements OnInit {
  scholars: FirestoreScholar[] = [];

  @Input()
  hideAddress$: Observable<boolean>;
  hideAddresses: boolean;

  constructor(private user: UserService) {}

  ngOnInit(): void {
    this.user.getScholars().subscribe((scholars) => {
      this.scholars = scholars;
    });

    this.hideAddress$.subscribe((hideAddresses) => {
      this.hideAddresses = hideAddresses;
    })
  }
}
