import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { NgcCookieConsentService } from 'ngx-cookieconsent';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'axie-pad';

  constructor(private authService: AuthService,
              private ccService: NgcCookieConsentService) {
  }

  signOut(): void {
    this.authService.SignOut();
  }

  signedIn(): boolean {
    return this.authService.userState != null;
  }
}
