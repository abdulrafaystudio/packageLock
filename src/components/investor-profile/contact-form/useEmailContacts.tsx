
import { Investor } from '@/hooks/useInvestors';
import { cleanText } from '@/utils/textCleaning';
import { validateEmail } from '@/utils/security';

interface EmailContact {
  name: string;
  email: string;
  role: string;
}

export const useEmailContacts = (investor: Investor) => {
  const getEmailContacts = (): EmailContact[] => {
    const contacts: EmailContact[] = [];
    
    // Parse multiple contacts from comma-separated values
    const names = investor.contact_name?.split(',').map(n => n.trim()).filter(n => n) || [];
    const roles = investor.role?.split(',').map(r => r.trim()).filter(r => r) || [];
    const emails = investor.email?.split(',').map(e => e.trim()).filter(e => e && validateEmail(e)) || [];
    
    // Create contacts for each valid email found
    emails.forEach((email, index) => {
      const contact: EmailContact = {
        name: cleanText(names[index]) || names[0] || investor.investor_name || 'Contact',
        email: email,
        role: roles[index] || roles[0] || 'Contact',
      };
      contacts.push(contact);
    });
    
    // If no valid emails were found but we have the main email, validate and add it
    if (contacts.length === 0 && investor.email && validateEmail(investor.email.trim())) {
      contacts.push({
        name: cleanText(investor.contact_name) || investor.contact_name || investor.investor_name || 'Contact',
        email: investor.email.trim(),
        role: investor.role || 'Primary Contact',
      });
    }
    
    console.log('Parsed email contacts for investor:', {
      investorName: investor.investor_name,
      contactCount: contacts.length,
      contacts: contacts.map(c => ({ name: c.name, role: c.role, hasEmail: !!c.email }))
    });
    
    return contacts;
  };

  return { getEmailContacts };
};
