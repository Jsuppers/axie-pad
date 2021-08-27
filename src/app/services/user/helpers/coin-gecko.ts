
import { HttpClient } from '@angular/common/http';

export class CoinGecko {
  static async pollSLPPrice(http: HttpClient, fiatCurrency: string): Promise<number> {
    const slpAddress = '0xcc8fa225d80b9c7d42f96e9570156c65d6caaa25';
    return this.pollPrice(http, fiatCurrency, slpAddress);
  }

  static async pollAXSPrice(http: HttpClient, fiatCurrency: string): Promise<number> {
    const axsAddress = '0xbb0e17ef65f82ab018d8edd776e8dd940327b28b';
    return this.pollPrice(http, fiatCurrency, axsAddress);
  }

  static async pollPrice(http: HttpClient, fiatCurrency: string, ethAddress: string): Promise<number> {
    try {
      const api =
        'https://api.coingecko.com/api/v3/simple/token_price/ethereum';
      const url =
        api +
        '?contract_addresses=' +
        ethAddress +
        '&vs_currencies=' +
        fiatCurrency;
      const output = await http.get<any>(url).toPromise();
      return output[ethAddress][fiatCurrency];
    } catch (e) {
      return 0;
    }
  }
}
