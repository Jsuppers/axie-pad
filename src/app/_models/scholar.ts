import firebase from 'firebase';

export enum PaymentMethods {
  ronin,
  eth,
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
