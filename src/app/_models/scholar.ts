import firebase from 'firebase';

export enum PaymentMethods {
  ronin,
  eth,
}

export interface FirestoreScholar {
  id: string;
  name: string;
  email: string;
  group: string;
  roninAddress: string;
  paidTimes: number;
  scholarRoninAddress: string;
  preferredPaymentMethod: PaymentMethods;
  scholarEthAddress: string;
  managerShare: number;
  // defaults to undefined which means use the default share
  useOwnPayShare?: boolean;
  note: string;
}

export function DefaultFirestoreScholar(): FirestoreScholar {
  return {
    name: 'no name',
    email: '',
    group: '',
    id: firebase.firestore().collection('tmp').doc().id,
    roninAddress: '',
    scholarRoninAddress: '',
    paidTimes: 0,
    scholarEthAddress: '',
    preferredPaymentMethod: PaymentMethods.ronin,
    managerShare: 50,
    note: '',
  };
}
