import firebase from "firebase";
import { Role } from "./role";

export interface LinkedUser {
  id: string,
  email: string;
  role: Role;
}

export function LinkedUser(email: string, role: Role = Role.viewer): LinkedUser {
  return {
    id: btoa(email),
    email,
    role,
  };
}
