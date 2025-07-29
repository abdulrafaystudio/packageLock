
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useDarkMode } from '@/hooks/useDarkMode';

const DarkModeToggle = () => {
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <div className="fixed top-20 right-6 z-40">
      <div className={`p-3 rounded-lg border shadow-sm transition-colors duration-300 ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center space-x-2">
          {isDark ? <Moon className="h-4 w-4 text-gray-300" /> : <Sun className="h-4 w-4 text-gray-700" />}
          <Switch checked={isDark} onCheckedChange={toggleDarkMode} />
        </div>
      </div>
    </div>
  );
};

export default DarkModeToggle;
