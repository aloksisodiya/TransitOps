import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Lock, Mail, User, Users, AlertTriangle } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import ThemeToggle from "./ThemeToggle";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Driver");
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState(null);

  const { register, error, clearError, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
    setLocalError(null);
  }, [clearError]);

  const activeError = localError || error;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!name || !email || !password || !confirmPassword || !role) {
      setLocalError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    try {
      const user = await register(name, email, password, role, rememberMe);
      switch (user.role) {
        case "FleetManager":
          navigate("/fleet");
          break;
        case "Driver":
          navigate("/dashboard");
          break;
        case "SafetyOfficer":
          navigate("/drivers");
          break;
        case "FinancialAnalyst":
          navigate("/expenses");
          break;
        default:
          navigate("/dashboard");
      }
    } catch (err) {
      console.log("Registration error:", err.message);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col md:flex-row relative">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div className="md:w-5/12 bg-theme-panel border-r border-dark-border p-8 md:p-16 flex flex-col justify-between text-gray-300">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="TransitOps Logo" className="w-10 h-10 object-contain rounded" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
                TransitOps
              </h1>
              <p className="text-xs text-brand tracking-wider font-mono font-bold">
                SMART TRANSPORT OPERATIONS
              </p>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-xl font-semibold text-white mb-6 font-mono">
              Create your access profile:
            </h2>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-brand mt-1.5 flex-shrink-0 animate-pulse"></span>
                <span>Register with your name, email, and role.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-brand mt-1.5 flex-shrink-0 animate-pulse"></span>
                <span>
                  Role-based access is enforced immediately after signup.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-brand mt-1.5 flex-shrink-0 animate-pulse"></span>
                <span>You can switch between light and dark mode anytime.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-xs text-gray-500 font-mono mt-8">
          TRANSITOPS © 2026 · RBAC ENABLED
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 md:p-16 relative">
        {activeError && (
          <div className="absolute right-4 top-4 md:right-12 md:top-12 z-50 animate-bounce max-w-sm">
            <div className="bg-red-950/90 border border-red-500/50 text-red-300 p-4 rounded shadow-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-200 text-sm font-mono uppercase">
                  Error State
                </h4>
                <p className="text-xs mt-0.5 leading-relaxed">{activeError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-md bg-dark-surface/90 border border-dark-border p-8 rounded shadow-2xl backdrop-blur-md">
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-white tracking-tight font-mono">
              Create your account
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Register a new operational profile to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 font-mono">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aarav Patel"
                  className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 font-mono">
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aarav@transitops.com"
                  className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 font-mono">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 font-mono">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 font-mono">
                Role (RBAC)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Users className="h-4 w-4" />
                </span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none pl-9 appearance-none cursor-pointer"
                  disabled={loading}
                >
                  <option value="Admin">Admin</option>
                  <option value="FleetManager">Fleet Manager</option>
                  <option value="Driver">Driver</option>
                  <option value="SafetyOfficer">Safety Officer</option>
                  <option value="FinancialAnalyst">Financial Analyst</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  ▼
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs mt-2">
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-theme-panel border-dark-border text-brand focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                />
                Remember me
              </label>
              <Link
                to="/login"
                className="text-blue-400 hover:text-blue-300 font-mono transition-colors"
              >
                Back to login
              </Link>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all duration-200 hover:bg-brand-dark active:translate-y-px focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-60 mt-4 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-dark-border/40 text-center text-xs text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-brand hover:text-brand-light font-mono transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
