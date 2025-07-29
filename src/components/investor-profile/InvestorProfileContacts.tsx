import React from 'react';
import { Mail, Phone, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Investor } from '@/hooks/useInvestors';
import { formatPhoneNumber } from '@/utils/phoneFormatter';

interface InvestorProfileContactsProps {
  investor: Investor;
}

interface Contact {
  name: string;
  role: string;
  email: string;
  phone: string;
}

const InvestorProfileContacts = ({ investor }: InvestorProfileContactsProps) => {
  const parseContacts = (): Contact[] => {
    const contacts: Contact[] = [];
    
    // Parse multiple contacts from comma-separated values
    const names = investor.contact_name?.split(',').map(n => n.trim()).filter(n => n) || [];
    const roles = investor.role?.split(',').map(r => r.trim()).filter(r => r) || [];
    const emails = investor.email?.split(',').map(e => e.trim()).filter(e => e) || [];
    const phones = investor.phone?.split(',').map(p => formatPhoneNumber(p.trim())).filter(p => p) || [];
    
    // Determine the maximum number of contacts based on available data
    const maxContacts = Math.max(names.length, roles.length, emails.length, phones.length);
    
    for (let i = 0; i < maxContacts; i++) {
      const contact: Contact = {
        name: names[i] || '',
        role: roles[i] || '',
        email: emails[i] || '',
        phone: phones[i] || ''
      };
      
      // Only add contact if at least one field has data
      if (contact.name || contact.role || contact.email || contact.phone) {
        contacts.push(contact);
      }
    }
    
    // If no contacts were parsed but we have some data, create a single contact
    if (contacts.length === 0 && (investor.contact_name || investor.role || investor.email || investor.phone)) {
      contacts.push({
        name: investor.contact_name || '',
        role: investor.role || '',
        email: investor.email || '',
        phone: formatPhoneNumber(investor.phone || '')
      });
    }
    
    return contacts;
  };

  const contacts = parseContacts();

  if (contacts.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Key Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">No contact information available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Key Contacts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {contacts.map((contact, index) => (
          <div 
            key={index} 
            className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {contact.name || 'Contact'}
                </h4>
                {contact.role && (
                  <p className="text-primary-600 text-sm mb-3 font-medium bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded inline-block">
                    {contact.role}
                  </p>
                )}
                <div className="space-y-2">
                  {contact.email && contact.email.trim() && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                      <Mail className="h-3 w-3 mr-2 flex-shrink-0" />
                      <a 
                        href={`mailto:${contact.email}`} 
                        className="hover:text-primary-600 break-all"
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && contact.phone.trim() && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                      <Phone className="h-3 w-3 mr-2 flex-shrink-0" />
                      <a 
                        href={`tel:${contact.phone}`} 
                        className="hover:text-primary-600"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {(!contact.email || !contact.email.trim()) && (!contact.phone || !contact.phone.trim()) && (
                    <p className="text-gray-500 text-sm">No contact information available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default InvestorProfileContacts;
