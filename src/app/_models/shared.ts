import firebase from 'firebase';

export interface SharedConfig {
  id: string;
  scholars: string[];
}

export const DefaultSharedConfig = (): SharedConfig => {
  return {
    id: firebase.firestore().collection('tmp').doc().id,
    scholars: [],
  }
}
