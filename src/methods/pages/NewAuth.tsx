import React, { useState, useEffect } from "react";
import { useAuth } from "./../../contexts/AuthContext";
import { useSearchParams } from "react-router-dom";

export const NewAuth: React.FC = () => {
  const { login, signup } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSignup, setIsSignup] = useState(
    searchParams.get("mode") === "signup"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Update form mode when URL parameter changes
    const mode = searchParams.get("mode");
    setIsSignup(mode === "signup");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleMode = () => {
    const newMode = !isSignup;
    setIsSignup(newMode);
    setSearchParams({ mode: newMode ? "signup" : "login" });
  };

  return (
    <div className="max-w-md p-6 mx-auto mt-20 bg-white rounded shadow">
      <h2 className="text-2xl mb-4">{isSignup ? "Sign Up" : "Log In"}</h2>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          required
          className="w-full border border-gray-300 rounded px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          required
          className="w-full border border-gray-300 rounded px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {isSignup ? "Create Account" : "Log In"}
        </button>
      </form>
      <button
        className="mt-4 text-sm text-blue-600 underline"
        onClick={toggleMode}
      >
        {isSignup ? "Already have an account? Log in" : "New user? Sign up"}
      </button>
    </div>
  );
};
