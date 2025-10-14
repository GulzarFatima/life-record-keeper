import { useContext } from "react";
import { AuthCtx } from "./auth-context.jsx";

export function useAuth() {
  return useContext(AuthCtx);
}
