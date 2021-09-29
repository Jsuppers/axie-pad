import { AxiePart } from './part';

export interface Axie {
  id: string;
  name: string;
  image: string;
  breedCount: number;
  class: string;
  parts: AxiePart[];
}

export interface AxieResult {
  hasError: boolean;
  axies: Axie[];
}
