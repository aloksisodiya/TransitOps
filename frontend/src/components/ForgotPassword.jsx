import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Shield,
  Mail,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [mockLink, setMockLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setMockLink("");

    if (!email) {
      setError("Please enter your email address");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email },
      );
      setSuccess(true);
      if (response.data.mockLink) {
        setMockLink(response.data.mockLink);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md bg-dark-surface/90 border border-dark-border p-8 rounded shadow-2xl backdrop-blur-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <img src="/logo.png" alt="TransitOps Logo" className="w-8 h-8 object-contain rounded" />
          <span className="text-xl font-bold tracking-tight text-white font-mono">
            TransitOps
          </span>
        </div>

        {!success ? (
          <>
            <div className="mb-6 text-center">
              <h3 className="text-xl font-semibold text-white tracking-tight font-mono">
                Reset Password
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Enter your email address and we'll simulate sending a reset
                link.
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-950/40 border border-red-800/40 text-red-400 text-xs p-3 rounded font-mono">
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="fleet@transitops.com"
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none pl-9"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all duration-200 hover:bg-brand-dark active:translate-y-px focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? "Processing..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-950/40 border border-green-800/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white tracking-tight font-mono mb-2">
              Email Simulated
            </h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              We have mocked sending a reset link to{" "}
              <strong className="text-gray-300">{email}</strong>.
            </p>

            {mockLink && (
              <div className="mb-6 p-4 bg-dark-bg/80 border border-dark-border rounded text-left">
                <span className="text-[10px] text-brand font-mono font-bold uppercase tracking-wider block mb-1">
                  🔧 Hackathon Dev Link:
                </span>
                <p className="text-[11px] text-gray-400 mb-3 break-all font-mono">
                  Instead of checking an email inbox, you can click this
                  simulated link directly:
                </p>
                <a
                  href={mockLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-mono underline"
                >
                  Simulate Email Link Click{" "}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-dark-border/40 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
