import { NgModule } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { InMemoryCache } from '@apollo/client/core';
import {
  HttpBatchLink,
  HttpBatchLinkModule,
} from 'apollo-angular-link-http-batch';

const uri = 'https://axieinfinity.com/graphql-server-v2/graphql'; // <-- add the URL of the GraphQL server here

@NgModule({
  imports: [HttpBatchLinkModule],
})
export class GraphQLModule {
  constructor(apollo: Apollo, httpLink: HttpBatchLink) {
    apollo.create({
      link: httpLink.create({ uri, batchMax: 40 }) as any,
      cache: new InMemoryCache(),
    });
  }
}
