  query GetProfileNameByRoninAddress($roninAddress: String!) {
    publicProfileWithRoninAddress(roninAddress: $roninAddress) {
      accountId
      name
      __typename
    }
  }