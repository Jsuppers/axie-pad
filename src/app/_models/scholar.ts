import firebase from 'firebase';

export enum PaymentMethods {
  ronin,
  eth,
}

export interface ScholarEditPermissions {
  editAll: boolean;
}

export interface ScholarMetaData {
  // a list of allowed editors
  allowedEditors: Record<string, ScholarEditPermissions>;
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
  metaData?: ScholarMetaData;
  // defaults to undefined which means use the default share
  useOwnPayShare?: boolean;
  note: string;
}

export function DefaultFirestoreScholar(creatorUid: string): FirestoreScholar {
  const editors: Record<string, ScholarEditPermissions> = {};
  editors[creatorUid] = {
    editAll: true,
  }
  return {
    name: 'no name',
    email: '',
    group: '',
    metaData: {
      allowedEditors: editors,
    },
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
