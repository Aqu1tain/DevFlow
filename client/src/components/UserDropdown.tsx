import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

interface Props {
  username: string;
  onLogout: () => void;
}

export default function UserDropdown({ username, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer text-xs font-mono text-gray-500 hover:text-gray-300 transition-colors"
      >
        {username}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-36 bg-[#0f0f17] border border-white/[0.08] shadow-lg z-20">
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-xs font-mono text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            settings
          </Link>
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className="cursor-pointer w-full text-left px-4 py-2.5 text-xs font-mono text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            logout
          </button>
        </div>
      )}
    </div>
  );
}
