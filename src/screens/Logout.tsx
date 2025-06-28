import { useLogto } from "@logto/react";

export const Logout: React.FC = () => {
  const { signOut } = useLogto();

  return (
    <div>
      <button onClick={() => signOut()}>Logout</button>
    </div>
  );
};