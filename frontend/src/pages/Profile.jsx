import { useEffect, useState } from "react";
import { getProfile } from "../apis/auth";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getProfile();
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return <h1>Loading...</h1>;
  }

  return (
    <div>
      <h1>Profile</h1>

      <p>
        Name: {user.firstname} {user.lastname}
      </p>

      <p>
        Email: {user.email}
      </p>

      <p>
        Role: {user.role}
      </p>

      <p>
        Solved: {user.solvedProblems?.length || 0}
      </p>
    </div>
  );
}