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
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { FooterComponent } from './components/footer/footer.component';
import { TermsComponent } from './components/terms/terms.component';
import { PrivacyComponent } from './components/privacy/privacy.component';
import {
  NgcCookieConsentConfig,
  NgcCookieConsentModule,
} from 'ngx-cookieconsent';
import { CurrencyDialogComponent } from './components/dialogs/currency-dialog/currency-dialog.component';
import { MatSelectModule } from '@angular/material/select';
import { ShortenRoninAddressPipe } from './pipes/shorten-ronin-address.pipe';
import { MatMenuModule } from '@angular/material/menu';
import { ShortenNamePipe } from './pipes/shorten-name.pipe';
import { GraphQLModule } from './graphql.module';
import { MatTabsModule } from '@angular/material/tabs';
import { CacheMapService } from './services/cache-map.service';
import { CachingInterceptor } from './interceptors/cache-interceptor';
import { MatBadgeModule } from '@angular/material/badge';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { UserService } from './services/user/user.service';
import { DialogService } from './services/dialog.service';
import { EarningsTableComponent } from './components/dashboard/tables/earnings-table/earnings-table.component';
import { ArenaTableComponent } from './components/dashboard/tables/arena-table/arena-table.component';
import { PayDialogComponent } from './components/dialogs/pay-dialog/pay-dialog.component';
import { EditDialogComponent } from './components/dialogs/edit-dialog/edit-dialog.component';
import { DeleteDialogComponent } from './components/dialogs/delete-dialog/delete-dialog.component';
import { BreedProfitTableComponent } from './components/dashboard/tables/breed-profit-table/breed-profit-table.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ScholarMoreInfoComponent } from './components/dashboard/tables/scholar-more-info/scholar-more-info.component';
import { ChartsModule } from 'ng2-charts';
import { SlpChartComponent } from './slp-chart/slp-chart.component';
import { TitleDialogComponent } from './components/dialogs/title-dialog/title-dialog.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { AverageColorDialogComponent } from './components/dialogs/average-color-dialog/average-color-dialog.component';
import { TopEarnersComponent } from './components/dialogs/top-earners/top-earners.component';
import { ColorDialogComponent } from './components/dialogs/color-dialog/color-dialog.component';
import { MAT_COLOR_FORMATS, NgxMatColorPickerModule, NGX_MAT_COLOR_FORMATS } from '@angular-material-components/color-picker';
import { MatPaginatorModule } from '@angular/material/paginator';
import { AxieTableComponent } from './components/dashboard/tables/axie-table/axie-table.component';
import { PayShareDialogComponent } from './components/dialogs/pay-share-dialog/pay-share-dialog.component';
import {MatCheckboxModule} from '@angular/material/checkbox';


const cookieConfig: NgcCookieConsentConfig = {
  cookie: {
    domain: window.location.hostname,
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
    PayDialogComponent,
    BreedProfitTableComponent,
    ScholarMoreInfoComponent,
    SlpChartComponent,
    TitleDialogComponent,
    AverageColorDialogComponent,
    TopEarnersComponent,
    ColorDialogComponent,
    AxieTableComponent,
    PayShareDialogComponent,
  ],
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    NgcCookieConsentModule.forRoot(cookieConfig),
    AngularFireAuthModule,
    AngularFirestoreModule,
    MatCheckboxModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatSortModule,
    MatListModule,
    MatDividerModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatCardModule,
    MatSelectModule,
    MatMenuModule,
    MatTabsModule,
    MatBadgeModule,
    FormsModule,
    ReactiveFormsModule,
    FlexModule,
    GraphQLModule,
    NgxMatColorPickerModule,
    ClipboardModule,
    MatAutocompleteModule,
    FlexLayoutModule,
    ChartsModule,
    ScrollingModule,
  ],
  providers: [
    AuthService,
    UserService,
    DialogService,
    CacheMapService,
    { provide: Cache, useClass: CacheMapService },
    { provide: HTTP_INTERCEPTORS, useClass: CachingInterceptor, multi: true },
    { provide: MAT_COLOR_FORMATS, useValue: NGX_MAT_COLOR_FORMATS }
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
