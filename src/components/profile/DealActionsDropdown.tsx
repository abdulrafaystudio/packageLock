
import React from 'react';
import { MoreVertical, Edit, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface DealActionsDropdownProps {
  dealId: string;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
}

const DealActionsDropdown: React.FC<DealActionsDropdownProps> = ({
  dealId,
  currentStatus,
  onStatusChange
}) => {
  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Funded', label: 'Funded' }
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Funded':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeClassName = (status: string) => {
    if (status === 'Pending') {
      return 'bg-blue-500 text-white hover:bg-blue-600';
    }
    if (status === 'Funded') {
      return 'bg-green-500 text-white hover:bg-green-600';
    }
    return '';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          size="sm" 
          variant="outline" 
          className="deal-actions-dropdown-trigger bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700 hover:text-gray-900 h-8 w-8 p-0"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <DropdownMenuItem asChild>
          <Link to={`/edit-deal/${dealId}`} className="flex items-center w-full">
            <Edit className="h-4 w-4 mr-2" />
            Edit your Deal
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-purple-300" />
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            Status
            <Badge 
              variant={getStatusBadgeVariant(currentStatus)} 
              className={`ml-auto text-xs ${getStatusBadgeClassName(currentStatus)}`}
            >
              {currentStatus}
            </Badge>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            {statusOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onStatusChange(option.value)}
                className={`flex items-center justify-between ${
                  currentStatus === option.value ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
              >
                <span>{option.label}</span>
                {currentStatus === option.value && (
                  <Badge 
                    variant={getStatusBadgeVariant(option.value)} 
                    className={`text-xs ml-4 ${getStatusBadgeClassName(option.value)}`}
                  >
                    Current
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DealActionsDropdown;
