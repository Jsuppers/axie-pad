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
  group: string;
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
    group: '',
    id: firebase.firestore().collection('tmp').doc().id,
    roninAddress: '',
    scholarRoninAddress: '',
    paidTimes: 0,
    scholarEthAddress: '',
    preferredPaymentMethod: PaymentMethods.ronin,
    managerShare: 50,
  };
}

export function ExtractFirestoreScholar(scholar: Scholar): FirestoreScholar {
  return {
    name: scholar.name ?? 'no name',
    group: scholar.group ?? '',
    id: scholar.id ?? firebase.firestore().collection('tmp').doc().id,
    roninAddress: scholar.roninAddress ?? '',
    scholarRoninAddress: scholar.scholarRoninAddress ?? '',
    paidTimes: scholar.paidTimes ?? 0,
    scholarEthAddress: scholar.scholarEthAddress ?? '',
    preferredPaymentMethod: scholar.preferredPaymentMethod ?? PaymentMethods.ronin,
    managerShare: scholar.managerShare ?? 50,
  };
}
