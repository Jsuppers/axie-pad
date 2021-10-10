
import { Axie, AxieResult } from '../../../_models/axie';
import { Apollo, gql } from 'apollo-angular';
import { retryWhen } from 'rxjs/operators';
import { AxieGene } from "agp-npm/dist/axie-gene"; // Defaults to HexType.Bit256

import { retryStrategy } from './retry-strategy';

// Get the ronin name from a gql query
const GET_PROFILE_AXIES_BY_RONIN_ADDRESS = gql`
  query GetAxieBriefList($auctionType: AuctionType, $criteria: AxieSearchCriteria, $from: Int, $sort: SortBy, $size: Int, $owner: String) {
    axies(auctionType: $auctionType, criteria: $criteria, from: $from, sort: $sort, size: $size, owner: $owner) {
      total
      results {
        ...AxieBrief
        __typename
      }
      __typename
    }
  }

  fragment AxieBrief on Axie {
    id
    name
    stage
    class
    genes
    pureness
    breedCount
    image
    title
    battleInfo {
      banned
      __typename
    }
    auction {
      currentPrice
      currentPriceUSD
      __typename
    }
    parts {
      id
      name
      class
      type
      specialGenes
      __typename
    }
    __typename
  }
`;

// https://www.notion.so/axie/Axie-Ronin-Developer-Information-623c6756391249b5a64d08cffd25ea02
export class AccountAxies {

  // we store the addresses locally because if we have already seen it no need
  // to send another request
  private _axiesList: Map<string, Axie[]>;
  private _apollo: Apollo;

  constructor(apollo: Apollo) {
    this._axiesList = new Map<string, Axie[]>();
    this._apollo = apollo;
  }


  async getAxies(roninAddress: string): Promise<AxieResult> {
    var result: AxieResult = {
      hasError: false,
      axies: []
    };

    if (!roninAddress) {
      return result;
    }
    if (this._axiesList.has(roninAddress)) {
      result.axies = this._axiesList.get(roninAddress)
      return result;
    }
      try {
        var none = undefined;
        var variables = {
          "from": 0,
          "size": 1000000,
          "sort": "IdDesc",
          "auctionType": "All",
          "owner": roninAddress.replace('ronin:', '0x'),
          "criteria": {
            "region": none,
            "parts": none,
            "bodyShapes": none,
            "classes": none,
            "stages": none,
            "numMystic": none,
            "pureness": none,
            "title": none,
            "breedable": none,
            "breedCount": none,
            "hp": [],
            "skill": [],
            "speed": [],
            "morale": []
          }
        };

        const queryOutput: any = await this._apollo.query({
          query: GET_PROFILE_AXIES_BY_RONIN_ADDRESS,
          variables: variables,
        }).pipe(retryWhen(retryStrategy())).toPromise();

        if (queryOutput?.data?.axies &&
          queryOutput?.data?.axies?.results &&
          queryOutput?.data?.axies?.results?.length > 0) {

          (queryOutput?.data?.axies?.results as any[]).forEach((axie) => {
            result.axies.push({
              name: axie?.name,
              id: axie?.id,
              image: axie?.image,
              parts: axie?.parts,
              pureness: axie?.pureness,
              quality: this.getQuality(axie?.genes),
              breedCount: axie?.breedCount,
              class: axie?.class,
            });
          })
        }

      } catch (e) {
        result.hasError = true;
        console.log(e);
      }
    return result;
  }

  private getQuality(gene: string): number {
    try {
      const axieGene = new AxieGene(gene);
      return axieGene.getGeneQuality();
    } catch(e) {
      console.error(e);
      return 0;
    }
  }
}
