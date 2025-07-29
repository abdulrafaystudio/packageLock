
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ResourcesDropdown = () => {
  const location = useLocation();
  
  const resourcesPaths = ['/about-us', '/how-it-works', '/help-center'];
  const isActiveResources = resourcesPaths.includes(location.pathname);

  const triggerClassName = isActiveResources 
    ? "text-white bg-primary-600 hover:text-white hover:bg-primary-600 transition-colors text-base font-normal data-[state=open]:text-white data-[state=open]:bg-primary-600 px-4 py-2 rounded-full"
    : "text-gray-700 dark:text-gray-300 hover:text-white transition-colors text-base font-normal data-[state=open]:text-white data-[state=open]:bg-primary-600 px-4 py-2 rounded-full";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={triggerClassName}>
          Resources
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg z-50">
        <DropdownMenuItem asChild className="hover:bg-primary-600 hover:text-white focus:bg-primary-600 focus:text-white">
          <Link to="/about-us" className="text-gray-700 dark:text-gray-300 hover:text-white focus:text-white w-full block">
            About Us
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="hover:bg-primary-600 hover:text-white focus:bg-primary-600 focus:text-white">
          <Link to="/how-it-works" className="text-gray-700 dark:text-gray-300 hover:text-white focus:text-white w-full block">
            How It Works
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="hover:bg-primary-600 hover:text-white focus:bg-primary-600 focus:text-white">
          <Link to="/help-center" className="text-gray-700 dark:text-gray-300 hover:text-white focus:text-white w-full block">
            Help Center
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ResourcesDropdown;
