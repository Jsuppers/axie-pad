import firebase from 'firebase';

export interface Scholar {
  id: string;
  name: string;
  roninAddress: string;
  scholarRoninAddress: string;
  totalSLP: number;
  currentSLP: number;
  scholarShareSLP: number;
  managerShareSLP: number;
}

export function DefaultScholar(): Scholar {
  return {
    name: 'no name',
    id: firebase.firestore().collection('tmp').doc().id,
    currentSLP: 0,
    managerShareSLP: 0,
    roninAddress: '',
    scholarRoninAddress: '',
    scholarShareSLP: 0,
    totalSLP: 0,
  };
}
