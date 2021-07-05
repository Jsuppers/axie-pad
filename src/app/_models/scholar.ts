import firebase from 'firebase';
import { SLP } from './slp';
import { LeaderboardDetails } from './leaderboard';

export enum PaymentMethods {
  ronin,
  eth,
}

export interface Scholar extends FirestoreScholar {
  id: string;
  slp: SLP;
  leaderboardDetails: LeaderboardDetails;
  roninName: string;
  scholarRoninName: string;
}

export interface FirestoreScholar {
  id: string;
  name: string;
  roninAddress: string;
  scholarRoninAddress: string;
  preferredPaymentMethod: PaymentMethods;
  scholarEthAddress: string;
  managerShare: number;
}

export function DefaultFirestoreScholar(): FirestoreScholar {
  return {
    name: 'no name',
    id: firebase.firestore().collection('tmp').doc().id,
    roninAddress: '',
    scholarRoninAddress: '',
    scholarEthAddress: '',
    preferredPaymentMethod: PaymentMethods.ronin,
    managerShare: 50,
  };
}
