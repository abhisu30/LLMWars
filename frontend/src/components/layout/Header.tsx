import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle.tsx";
import { GitCompareArrows } from "lucide-react";

export function Header() {
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "Compare" },
    { path: "/history", label: "History" },
    { path: "/admin", label: "Admin" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur">
      <div className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
            <GitCompareArrows size={22} className="text-[hsl(var(--primary))]" />
            LLM Compare
          </Link>
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  location.pathname === link.path
                    ? "bg-[hsl(var(--accent))] font-medium"
                    : "hover:bg-[hsl(var(--accent))]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
