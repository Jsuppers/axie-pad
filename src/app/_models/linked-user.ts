import { Role } from "./role";

export interface LinkedUser {
  uid: string;
  role: Role;
}

export function LinkedUser(uid: string, role: Role = Role.Viewer): LinkedUser {
  return {
    uid,
    role,
  };
}
