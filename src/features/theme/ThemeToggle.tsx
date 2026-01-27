import { useUiStore, type Theme } from "@/stores/uiStore";

const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: "light",
    label: "Light",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    ),
  },
  {
    value: "system",
    label: "System",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
];

export function ThemeToggle() {
  const { theme, setTheme } = useUiStore();

  const currentIndex = themes.findIndex((t) => t.value === theme);

  const handleToggle = () => {
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].value);
  };

  const currentTheme = themes[currentIndex];

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={`Theme: ${currentTheme.label}`}
    >
      {currentTheme.icon}
    </button>
  );
}
