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
  paidTimes: number;
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
    paidTimes: 0,
    scholarEthAddress: '',
    preferredPaymentMethod: PaymentMethods.ronin,
    managerShare: 50,
  };
}
