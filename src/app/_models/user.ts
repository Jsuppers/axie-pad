import { FirestoreScholar } from './scholar';

export interface User {
  scholars: Record<string, FirestoreScholar>;
  currency: string;
  title: string;
  // Average SLP colors, 4 colors red, orange, green, pink
  colors: number[];
  groupColors: Record<string, string>;
}
