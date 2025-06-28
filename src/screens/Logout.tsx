import { useLogto } from "@logto/react";
import { getLogoutRedirectUrl } from "../utils/auth";

export const Logout: React.FC = () => {
  const { signOut } = useLogto();

  return (
    <div>
      <button onClick={() => signOut(getLogoutRedirectUrl())}>Logout</button>
    </div>
  );
};