import firebase from "firebase"

export enum RuleType {
  slpCount,
  axieCount,
}

export interface Rule {
  type: RuleType;
  id: string;
}

export interface SLPRule extends Rule {
  lessThan: number;
}

export interface AxieCountRule extends Rule {
  greaterThan: number;
  lessThan: number;
}

export function DefaultSLPRule(): SLPRule {
  return {
    type: RuleType.slpCount,
    id: firebase.firestore().collection('tmp').doc().id,
    lessThan: 70,
  }
}

export function DefaultAxieCountRule(): AxieCountRule {
  return {
    type: RuleType.axieCount,
    id: firebase.firestore().collection('tmp').doc().id,
    lessThan: 3,
    greaterThan: 0,
  }
}
