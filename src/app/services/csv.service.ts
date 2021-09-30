import { Injectable } from '@angular/core';

import { FirestoreScholar, PaymentMethods } from '../_models/scholar';
import { UserService } from './user/user.service';

export type Header = {
  title: string;
  fieldName: keyof FirestoreScholar;
  replacer: (key: string, value: any) => string;
};

@Injectable({
  providedIn: 'root',
})
export class CsvService {
  private _scholars: FirestoreScholar[];

  constructor(private userService: UserService) {
    this.userService.getScholars().subscribe((scholars) => {
      this._scholars = scholars;
    });
  }

  export() {
    const headers: Header[] = [
      {
        title: 'Ronin Address',
        fieldName: 'roninAddress',
        replacer: (key, value: string) => (value === null ? '' : value),
      },
      {
        title: 'Name',
        fieldName: 'name',
        replacer: (key, value: string) => (value === null ? '' : value),
      },
      {
        title: 'Group',
        fieldName: 'group',
        replacer: (key, value: string) => (value === null ? '' : value),
      },
      {
        title: 'Email',
        fieldName: 'email',
        replacer: (key, value: string) => (value === null ? '' : value),
      },
      {
        title: 'Use own payscale',
        fieldName: 'useOwnPayShare',
        replacer: (key, value: boolean) => (value === true ? 'true' : 'false'),
      },
      {
        title: "Manager's share",
        fieldName: 'managerShare',
        replacer: (key, value) => value,
      },
      {
        title: 'Preferred payment',
        fieldName: 'preferredPaymentMethod',
        replacer: (key, value) =>
          value === PaymentMethods.eth ? 'eth' : 'ronin',
      },
      {
        title: 'Scholar ronin address',
        fieldName: 'roninAddress',
        replacer: (key, value) => (value === null ? '' : value),
      },
      {
        title: 'Scholar eth address',
        fieldName: 'scholarEthAddress',
        replacer: (key, value) => (value === null ? '' : value),
      },
    ];

    const csv = this._scholars.map((scholar) =>
      headers
        .map((header) =>
          JSON.stringify(scholar[header.fieldName], header.replacer)
        )
        .join(',')
    );

    csv.unshift(headers.map((header) => header.title).join(','));

    const csvArray = csv.join('\r\n');
    const blob = new Blob([csvArray], { type: 'text/csv' });

    const a = document.createElement('a');
    const url = window.URL.createObjectURL(blob);

    a.href = url;
    a.download = 'scholars.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }
}
