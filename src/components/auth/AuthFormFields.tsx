
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AuthFormFieldsProps {
  isSignUp: boolean;
  formData: {
    fullName: string;
    email: string;
    password: string;
    companyName: string;
  };
  formErrors: Record<string, string>;
  handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDisabled?: boolean;
}

const AuthFormFields = ({ 
  isSignUp, 
  formData, 
  formErrors, 
  handleInputChange,
  onInputChange,
  isDisabled = false
}: AuthFormFieldsProps) => {
  const inputChangeHandler = handleInputChange || onInputChange;

  return (
    <div className="space-y-4">
      {isSignUp && (
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={inputChangeHandler}
            disabled={isDisabled}
            className={formErrors.fullName ? 'border-red-500' : ''}
          />
          {formErrors.fullName && (
            <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={inputChangeHandler}
          disabled={isDisabled}
          className={formErrors.email ? 'border-red-500' : ''}
        />
        {formErrors.email && (
          <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={inputChangeHandler}
          disabled={isDisabled}
          className={formErrors.password ? 'border-red-500' : ''}
        />
        {formErrors.password && (
          <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
        )}
      </div>

      {isSignUp && (
        <div>
          <Label htmlFor="companyName">Company Name (Optional)</Label>
          <Input
            id="companyName"
            name="companyName"
            type="text"
            value={formData.companyName}
            onChange={inputChangeHandler}
            disabled={isDisabled}
            className={formErrors.companyName ? 'border-red-500' : ''}
          />
          {formErrors.companyName && (
            <p className="text-red-500 text-sm mt-1">{formErrors.companyName}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthFormFields;
