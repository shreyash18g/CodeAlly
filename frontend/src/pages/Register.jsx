import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { register } from "../apis/auth";

export default function Register() {
  const navigate = useNavigate();

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await register(
        firstname,
        lastname,
        email,
        password
      );

      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data ||
        "Registration Failed"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">

      <form
        onSubmit={handleRegister}
        className="flex flex-col gap-3 w-96"
      >
        <h1 className="text-3xl">
          Register
        </h1>

        <input
          placeholder="First Name"
          value={firstname}
          onChange={(e) =>
            setFirstname(e.target.value)
          }
        />

        <input
          placeholder="Last Name"
          value={lastname}
          onChange={(e) =>
            setLastname(e.target.value)
          }
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        {error && (
          <p style={{ color: "red" }}>
            {error}
          </p>
        )}

        <button type="submit">
          Register
        </button>
      </form>

    </div>
  );
}