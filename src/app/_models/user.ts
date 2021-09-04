import { FirestoreScholar } from './scholar';
import { Defaults } from './defaults';
import { defaultColors } from '../constants';
import { LinkedUser } from './linked-user';
import { Table } from './table';

export interface User {
  scholars: Record<string, FirestoreScholar>;
  currency: string;
  title: string;
  // Average SLP colors, 4 colors red, orange, green, pink
  colors: number[];
  groupColors: Record<string, string>;
  defaults?: Defaults;
  linkedUsers?: Record<string, LinkedUser>;
  linkedTables?: Record<string, Table>;
}

export function DefaultUser(): User {
  return {
    scholars: {},
    currency: 'usd',
    title: 'Change Me 🥺',
    colors: defaultColors,
    groupColors: {},
    linkedUsers: {},
    linkedTables: {},
    defaults: {
      payshare: [{
        manager: 50,
        scholar: 50,
      }]
    }
  }
}
