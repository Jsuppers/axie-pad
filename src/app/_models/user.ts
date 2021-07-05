import { FirestoreScholar } from './scholar';

export interface User {
  scholars: Record<string, FirestoreScholar>;
  currency: string;
}
