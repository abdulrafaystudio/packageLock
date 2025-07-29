
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSupportTicket } from '@/hooks/useSupportTicket';

const HelpCenterContact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');

  const { submitSupportTicket, isSubmitting } = useSupportTicket();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      return;
    }

    const result = await submitSupportTicket(formData);
    
    if (result.success) {
      setIsSuccess(true);
      setTicketNumber(result.ticketNumber || '');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 md:p-12 transition-colors duration-300">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
              Support Ticket Created!
            </h3>
            <p className="text-green-700 dark:text-green-300 mb-4">
              Your support ticket has been successfully created.
            </p>
            <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-md p-4 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your ticket number:</p>
              <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">{ticketNumber}</p>
            </div>
            <p className="text-green-700 dark:text-green-300 text-sm mb-6">
              You'll receive a confirmation email shortly with your ticket details. Our support team will respond within 24-48 hours.
            </p>
            <Button 
              onClick={() => setIsSuccess(false)}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              Submit Another Ticket
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 md:p-12 transition-colors duration-300">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12 transition-colors duration-300">
        Need More Help?
      </h2>

      <div className="max-w-2xl mx-auto">
        <Card className="border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
          <CardContent className="p-8">
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="border-gray-300 dark:border-gray-600"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="border-gray-300 dark:border-gray-600"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject *
                </label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="border-gray-300 dark:border-gray-600"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message *
                </label>
                <Textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  value={formData.message}
                  onChange={handleInputChange}
                  className="border-gray-300 dark:border-gray-600"
                  placeholder="Please describe your issue or question in detail..."
                  disabled={isSubmitting}
                />
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white"
              >
                {isSubmitting ? 'Sending Message...' : 'Send Message'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpCenterContact;
