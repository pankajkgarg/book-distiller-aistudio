import React from 'react';
import {
  FaPlay,
  FaPause,
  FaStop,
  FaFileArrowDown,
  FaClipboard,
  FaChevronRight,
  FaXmark,
  FaFilePdf,
  FaRepeat,
  FaKey,
  FaGear,
  FaClockRotateLeft,
  FaSpinner,
  FaSun,
  FaMoon,
  FaDesktop,
} from 'react-icons/fa6';

export {
  FaPlay as PlayIcon,
  FaPause as PauseIcon,
  FaStop as StopIcon,
  FaFileArrowDown as ExportIcon,
  FaClipboard as ClipboardIcon,
  FaChevronRight as ChevronRightIcon,
  FaXmark as CloseIcon,
  FaFilePdf as FileIcon,
  FaRepeat as ReplaceIcon,
  FaKey as KeyIcon,
  FaGear as SettingsIcon,
  FaClockRotateLeft as HistoryIcon,
  FaSun as SunIcon,
  FaMoon as MoonIcon,
  FaDesktop as DesktopIcon,
};

// SpinnerIcon requires special handling to apply the animation class by default.
export const SpinnerIcon: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <FaSpinner className={`animate-spin ${className}`} />
);