import type { ReactNode } from "react";
import { buttonClass } from "./Button";
import GitHubIcon from "./GitHubIcon";
import { API_BASE } from "../services/api";

export const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.06] rounded-none px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors";

export function Divider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/[0.06]" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[#0a0a0f] px-3 text-[11px] text-gray-600 font-mono">or</span>
      </div>
    </div>
  );
}

export function GitHubButton({ redirectTo }: { redirectTo?: string }) {
  const handleClick = () => {
    if (redirectTo && redirectTo !== "/snippets")
      sessionStorage.setItem("auth_redirect", redirectTo);
  };

  return (
    <a href={`${API_BASE}/auth/github`} onClick={handleClick} className={buttonClass("ghost", "flex items-center justify-center gap-2 w-full px-4 py-2.5")}>
      <GitHubIcon className="w-4 h-4" />
      continue with github
    </a>
  );
}

interface Props {
  subtitle: string;
  footer?: ReactNode;
  children: ReactNode;
}

export default function AuthLayout({ subtitle, footer, children }: Props) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-mono font-semibold tracking-tight">
            dev<span className="text-emerald-400">flow</span>
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-mono">{subtitle}</p>
        </div>

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6 space-y-5">
          {children}
        </div>

        {footer}
      </div>
    </div>
  );
}
