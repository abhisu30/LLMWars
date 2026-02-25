import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.tsx";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="rounded-md p-2 hover:bg-[hsl(var(--accent))] transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
