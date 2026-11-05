import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Shield, Lock, Mail, Users, AlertTriangle } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const Login = () => {
  const [email, setEmail] = useState("admin@transitops.com");
  const [password, setPassword] = useState("Password123");
  const [role, setRole] = useState("Admin"); // Auto-filled for testing
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState(null);

  const { login, error, clearError, loading } = useAuthStore();
  const navigate = useNavigate();

  // Clear errors on mount
  useEffect(() => {
    clearError();
    setLocalError(null);
  }, [clearError]);

  // Combine store and local errors
  const activeError = localError || error;

  const handleRoleQuickSelect = (selectedRole) => {
    setRole(selectedRole);
    switch (selectedRole) {
      case "FleetManager":
        setEmail("fleet@transitops.com");
        setPassword("Password123");
        break;
      case "Dispatcher":
        setEmail("driver@transitops.com");
        setPassword("Password123");
        break;
      case "SafetyOfficer":
        setEmail("safety@transitops.com");
        setPassword("Password123");
        break;
      case "FinancialAnalyst":
        setEmail("analyst@transitops.com");
        setPassword("Password123");
        break;
      case "Admin":
        setEmail("admin@transitops.com");
        setPassword("Password123");
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password || !role) {
      setLocalError("Please fill in all fields");
      return;
    }

    try {
      const user = await login(email, password, role, rememberMe);
      // Redirect based on role
      switch (user.role) {
        case "FleetManager":
          navigate("/fleet");
          break;
        case "Dispatcher":
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
      // Error handled by store, shown in UI
      console.log("Login error:", err.message);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col md:flex-row relative">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      {/* LEFT SIDE: Branding Panel (Greyish operational panel) */}
      <div className="md:w-5/12 bg-theme-panel border-r border-dark-border p-6 md:pt-6 md:px-12 md:pb-8 flex flex-col justify-start text-gray-300">
        <div>
          {/* Logo Brand */}
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
              One login, multiple roles:
            </h2>
            <ul className="space-y-4">
              {[
                { name: "Admin", desc: "Full system access" },
                { name: "Fleet Manager", desc: "Registry & Maintenance" },
                { name: "Dispatcher", desc: "Creates trips, assigns assets, monitors active deliveries" },
                { name: "Safety Officer", desc: "Driver safety compliance" },
                { name: "Financial Analyst", desc: "Expenses & ROI analysis" },
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand mt-1.5 flex-shrink-0 animate-pulse"></span>
                  <div>
                    <span
                      className="font-medium text-white hover:text-brand cursor-pointer"
                      onClick={() =>
                        handleRoleQuickSelect(item.name.replace(" ", ""))
                      }
                    >
                      {item.name}
                    </span>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-xs text-gray-500 font-mono mt-8">
          TRANSITOPS © 2026 · RBAC ENABLED
        </div>
      </div>

      {/* RIGHT SIDE: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 relative">
        {/* Wireframe Floating Error State style indicator */}
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
              Sign in to your account
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Enter your credentials to continue
            </p>
          </div>

          {/* Quick seeded login helper button array for hackathon evaluation */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* EMAIL */}
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
                  placeholder="Raven.k@transitops.in"
                  className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            {/* PASSWORD */}
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

            {/* ROLE DROPDOWN */}
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
                  <option value="Dispatcher">Dispatcher / Driver</option>
                  <option value="SafetyOfficer">Safety Officer</option>
                  <option value="FinancialAnalyst">Financial Analyst</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  ▼
                </div>
              </div>
            </div>

            {/* REMEMBER ME & FORGOT PASSWORD */}
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
                to="/forgot-password"
                className="text-blue-400 hover:text-blue-300 font-mono transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* SIGN IN BUTTON */}
            <button
              type="submit"
              className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all duration-200 hover:bg-brand-dark active:translate-y-px focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-60 mt-4 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Scoped list context */}
          <div className="mt-8 pt-6 border-t border-dark-border/40 text-left">
            <h4 className="text-[11px] font-bold text-brand uppercase font-mono tracking-wider mb-2">
              Access Scopes Details:
            </h4>
            <ul className="space-y-1 text-xs text-gray-400 font-mono">
              <li>• Fleet Manager ➔ Fleet, Maintenance</li>
              <li>• Dispatcher ➔ Dashboard, Trips</li>
              <li>• Safety Officer ➔ Drivers, Compliance</li>
              <li>• Financial Analyst ➔ Fuel & Expenses, Analytics</li>
            </ul>
          </div>

          <div className="mt-5 text-center text-xs text-gray-400">
            New here?{" "}
            <Link
              to="/register"
              className="text-brand hover:text-brand-light font-mono transition-colors"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
