import firebase from 'firebase';

export interface SharedConfig {
  id: string;
  scholars: string[];
}

export function DefaultSharedConfig(): SharedConfig {
  return {
    id: firebase.firestore().collection('tmp').doc().id,
    scholars: [],
  }
}
