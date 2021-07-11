import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { environment } from '../environments/environment';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { AuthService } from './services/auth.service';
import { EarningsTableComponent } from './components/earnings-table/earnings-table.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { EditDialogComponent } from './components/edit-dialog/edit-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSortModule } from '@angular/material/sort';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FlexModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { DonateComponent } from './components/donate/donate.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DeleteDialogComponent } from './components/delete-dialog/delete-dialog.component';
import { FooterComponent } from './components/footer/footer.component';
import { TermsComponent } from './components/terms/terms.component';
import { PrivacyComponent } from './components/privacy/privacy.component';
import {
  NgcCookieConsentConfig,
  NgcCookieConsentModule,
} from 'ngx-cookieconsent';
import { CurrencyDialogComponent } from './components/currency-dialog/currency-dialog.component';
import { MatSelectModule } from '@angular/material/select';
import { ShortenRoninAddressPipe } from './pipes/shorten-ronin-address.pipe';
import { MatMenuModule } from '@angular/material/menu';
import { ShortenNamePipe } from './pipes/shorten-name.pipe';
import { GraphQLModule } from './graphql.module';
import { MatTabsModule } from '@angular/material/tabs';
import { ArenaTableComponent } from './components/arena-table/arena-table.component';
import { ProfileTableComponent } from './components/profile-table/profile-table.component';
import { CacheMapService } from './services/cache-map.service';
import { CachingInterceptor } from './interceptors/cache-interceptor';
import { MatBadgeModule } from '@angular/material/badge';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

const cookieConfig: NgcCookieConsentConfig = {
  cookie: {
    domain: environment.host,
  },
  palette: {
    popup: {
      background: '#000',
    },
    button: {
      background: '#f1d600',
    },
  },
  theme: 'edgeless',
  type: 'opt-out',
  layout: 'my-custom-layout',
  layouts: {
    'my-custom-layout': '{{messagelink}}{{compliance}}',
  },
  elements: {
    messagelink: `
    <span id="cookieconsent:desc" class="cc-message">{{message}}
      <a aria-label="learn more about our privacy policy" tabindex="1" class="cc-link" href="{{privacyPolicyHref}}" >{{privacyPolicyLink}}</a> and our
      <a aria-label="learn more about our terms of service" tabindex="2" class="cc-link" href="{{tosHref}}">{{tosLink}}</a>
    </span>
    `,
  },
  content: {
    message:
      'By using our site, you acknowledge that you have read and understand our ',
    privacyPolicyLink: 'Privacy Policy',
    privacyPolicyHref: '#/privacy',
    tosLink: 'Terms of Conditions',
    tosHref: '#/terms',
  },
};

@NgModule({
  declarations: [
    AppComponent,
    EarningsTableComponent,
    ArenaTableComponent,
    ProfileTableComponent,
    EditDialogComponent,
    DashboardComponent,
    SignInComponent,
    DeleteDialogComponent,
    DonateComponent,
    FooterComponent,
    TermsComponent,
    PrivacyComponent,
    CurrencyDialogComponent,
    ShortenRoninAddressPipe,
    ShortenNamePipe,
  ],
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    NgcCookieConsentModule.forRoot(cookieConfig),
    AngularFireAuthModule,
    AngularFirestoreModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatTableModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatSortModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatCardModule,
    MatSelectModule,
    MatMenuModule,
    MatTabsModule,
    MatBadgeModule,
    FormsModule,
    FlexModule,
    GraphQLModule,
    ClipboardModule,
  ],
  providers: [
    AuthService,
    CacheMapService,
    { provide: Cache, useClass: CacheMapService },
    { provide: HTTP_INTERCEPTORS, useClass: CachingInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
