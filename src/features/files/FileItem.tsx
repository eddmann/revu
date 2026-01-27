import { clsx } from "clsx";
import type { FileEntry, FileStatus } from "@/types/git";
import { Checkbox } from "@/components/ui";

interface FileItemProps {
  file: FileEntry;
  isSelected: boolean;
  onSelect: () => void;
  onStageToggle: () => void;
}

const statusConfig: Record<FileStatus, { label: string; color: string }> = {
  modified: { label: "M", color: "text-yellow-600 dark:text-yellow-400" },
  added: { label: "A", color: "text-green-600 dark:text-green-400" },
  deleted: { label: "D", color: "text-red-600 dark:text-red-400" },
  renamed: { label: "R", color: "text-blue-600 dark:text-blue-400" },
  copied: { label: "C", color: "text-purple-600 dark:text-purple-400" },
  untracked: { label: "U", color: "text-gray-500 dark:text-gray-400" },
  ignored: { label: "I", color: "text-gray-400 dark:text-gray-500" },
  conflicted: { label: "!", color: "text-red-600 dark:text-red-400" },
};

export function FileItem({
  file,
  isSelected,
  onSelect,
  onStageToggle,
}: FileItemProps) {
  const { label, color } = statusConfig[file.status];
  const fileName = file.path.split("/").pop() || file.path;
  const dirPath = file.path.includes("/")
    ? file.path.slice(0, file.path.lastIndexOf("/"))
    : "";

  return (
    <div
      className={clsx(
        "flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        isSelected && "bg-blue-50 dark:bg-blue-900/30",
      )}
      onClick={onSelect}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          onStageToggle();
        }}
      >
        <Checkbox checked={file.staged} onChange={() => {}} />
      </div>

      <span
        className={clsx("font-mono text-xs font-bold w-4 text-center", color)}
      >
        {label}
      </span>

      <div className="flex-1 min-w-0 flex flex-col">
        <span className="text-sm truncate text-gray-900 dark:text-gray-100">
          {fileName}
        </span>
        {dirPath && (
          <span className="text-xs truncate text-gray-500 dark:text-gray-400">
            {dirPath}
          </span>
        )}
      </div>
    </div>
  );
}
