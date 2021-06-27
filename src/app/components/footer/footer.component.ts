import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  constructor(
    public router: Router,
    public ngZone: NgZone) {
  }

  ngOnInit(): void {
  }

  termsClick(): void {
    this.ngZone.run(() => {
      this.router.navigate(['terms']);
    });
  }

  privacyClick(): void {
    this.ngZone.run(() => {
      this.router.navigate(['privacy']);
    });
  }

  githubClick(): void {
    this.ngZone.run(() => {
      this.router.navigateByUrl('https://github.com/Jsuppers/axie-pad');
    });
  }
}
