import firebase from 'firebase';

export interface Table {
  name: string;
  id: string;
  tableID: string;
}

export function DefaultTable(
  tableID: string = '',
  name: string = 'no name'
): Table {
  return {
    id: firebase.firestore().collection('tmp').doc().id,
    name,
    tableID,
  };
}
