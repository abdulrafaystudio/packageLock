
export interface ContactEmailRequest {
  investorName: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  message: string;
  contacts: Array<{
    name?: string;
    email?: string;
    role?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  contact: string;
  emailId?: string;
  error?: string;
  response?: any;
}
