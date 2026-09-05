import { useState } from "react";
import { Microscope, ShieldCheck, Stethoscope, User, Mail, Lock, ArrowRight, Zap } from "lucide-react";
import type { User as UserType, Role } from "../types";

interface Props {
  onLogin: (user: UserType) => void;
}

const CLINICIAN: UserType = {
  name: "Dr. Alex Mercer, MD",
  id: "CLIN-8042",
  role: "clinician",
  email: "a.mercer@medlens.health",
  avatar: "AM",
};

const PATIENT: UserType = {
  name: "Patient Portal",
  id: "PT-9042",
  role: "patient",
  email: "patient@medlens.health",
  avatar: "PP",
};

export function LoginView({ onLogin }: Props) {
  const [role, setRole] = useState<Role>("clinician");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const selectedUser = role === "clinician" ? CLINICIAN : PATIENT;

  function handleLogin() {
    onLogin(selectedUser);
  }

  function handleQuickLogin() {
    onLogin(selectedUser);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 p-4">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400/5 blur-3xl" />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(15,23,42,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-md animate-[fadeIn_0.5s_ease]">
        {/* Logo header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 shadow-xl shadow-brand-500/25">
            <Microscope className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">MedLens</h1>
          <p className="mt-1 text-xs text-slate-500 uppercase tracking-[0.2em]">Clinical Information Intelligence</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-50 px-3 py-1">
            <ShieldCheck className="h-3 w-3 text-brand-600" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">Secure Clinical Portal</span>
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/40">
          {/* Role toggle */}
          <div className="mb-5">
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Select Portal</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRole("clinician")}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all duration-200 ${
                  role === "clinician"
                    ? "border-brand-500/50 bg-brand-50 shadow-lg shadow-brand-500/10"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${role === "clinician" ? "bg-brand-100" : "bg-slate-100"}`}>
                  <Stethoscope className={`h-4 w-4 ${role === "clinician" ? "text-brand-600" : "text-slate-400"}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold ${role === "clinician" ? "text-brand-700" : "text-slate-500"}`}>Clinician</p>
                  <p className="text-[10px] text-slate-400 truncate">Reviewer Mode</p>
                </div>
              </button>
              <button
                onClick={() => setRole("patient")}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all duration-200 ${
                  role === "patient"
                    ? "border-cyan-500/50 bg-cyan-50 shadow-lg shadow-cyan-500/10"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${role === "patient" ? "bg-cyan-100" : "bg-slate-100"}`}>
                  <User className={`h-4 w-4 ${role === "patient" ? "text-cyan-600" : "text-slate-400"}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold ${role === "patient" ? "text-cyan-700" : "text-slate-500"}`}>Patient</p>
                  <p className="text-[10px] text-slate-400 truncate">Self-Intake Mode</p>
                </div>
              </button>
            </div>
          </div>

          {/* Selected user preview */}
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${role === "clinician" ? "bg-brand-100 text-brand-700" : "bg-cyan-100 text-cyan-700"}`}>
              {selectedUser.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 truncate">{selectedUser.name}</p>
              <p className="text-[10px] text-slate-400">ID: {selectedUser.id}</p>
            </div>
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@medlens.health"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition"
              />
            </div>
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all duration-200 hover:shadow-brand-500/30 hover:brightness-110"
          >
            Sign In to Portal
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Quick demo login */}
          <button
            onClick={handleQuickLogin}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
          >
            <Zap className="h-4 w-4" />
            Demo Quick Login
          </button>
        </div>

        <p className="mt-6 text-center text-[10px] text-slate-400">
          MedLens does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.
        </p>
      </div>
    </div>
  );
}
