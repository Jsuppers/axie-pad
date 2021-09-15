export interface Axie {
  id: string;
  name: string;
  image: string;
  breedCount: number;
  class: string;
}

export interface AxieResult {
  hasError: boolean;
  axies: Axie[];
}
