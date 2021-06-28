import firebase from 'firebase';

export interface Scholar {
  id: string;
  name: string;
  accountEthAddress: string;
  scholarRoninAddress: string;
  notClaimableSLP: number;
  claimableSLP: number; // claimable_total
  lastClaimed: number;
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
    notClaimableSLP: 0,
    claimableSLP: 0,
    managerShareSLP: 0,
    lastClaimed: 0,
    accountEthAddress: '',
    scholarRoninAddress: '',
    scholarShareSLP: 0,
    totalSLP: 0,
  };
}
