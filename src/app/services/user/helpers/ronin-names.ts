import { Scholar } from '../../../_models/scholar';
import { Apollo, gql } from 'apollo-angular';


// Get the ronin name from a gql query
const GET_PROFILE_NAME_BY_RONIN_ADDRESS = gql`
  query GetProfileNameByRoninAddress($roninAddress: String!) {
    publicProfileWithRoninAddress(roninAddress: $roninAddress) {
      accountId
      name
      __typename
    }
  }
`;

export class RoninNames {
  // we store the addresses locally because if we have already seen it no need
  // to send another request
  private _roninAddressNames: Map<string, string>;
  private _apollo: Apollo;

  constructor(apollo: Apollo) {
    this._roninAddressNames = new Map<string, string>();
    this._apollo = apollo;
  }

  async getScholarRoninName(scholar: Scholar): Promise<void> {
    return this._getRoninName(
      scholar,
      'scholarRoninAddress',
      'scholarRoninName'
    );
  }

  async getRoninName(scholar: Scholar): Promise<void> {
    return this._getRoninName(
      scholar,
      'roninAddress',
      'roninName',
    );
  }

  private async _getRoninName(
    scholar: Scholar,
    addressField: string,
    nameField: string
  ): Promise<void> {
    const address = scholar[addressField];
    let name = 'unknown';
    if (!address) {
      return;
    }
    if (this._roninAddressNames.has(address)) {
      name = this._roninAddressNames.get(address);
    } else if (address.length === 0) {
      name = '';
    } else {
      try {
        const data: any = await this._apollo
          .query({
            query: GET_PROFILE_NAME_BY_RONIN_ADDRESS,
            variables: {
              roninAddress: address.replace('ronin:', '0x'),
            },
          })
          .toPromise();

        const profileName = data?.data?.publicProfileWithRoninAddress?.name;
        if (profileName) {
          name = profileName;
        }
      } catch (e) {
        console.log(e);
      }
      this._roninAddressNames.set(address, name);
    }
    scholar[nameField] = name;
  }
}
