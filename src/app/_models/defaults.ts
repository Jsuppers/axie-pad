import { PayShare } from "./pay-share";

export interface Defaults {
  // we use a list so that the admin can pick different pay scales
  payshare?: PayShare[];
}
