import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 transition-colors duration-300">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 hover:text-gray-900 dark:hover:text-white">Privacy Policy</h1>
            
            <div className="prose prose-gray dark:prose-invert max-w-none [&_*]:hover:text-gray-900 dark:[&_*]:hover:text-white [&_h2]:hover:text-gray-900 dark:[&_h2]:hover:text-white [&_p]:hover:text-gray-600 dark:[&_p]:hover:text-gray-300">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 hover:text-gray-600 dark:hover:text-gray-400">Last updated: June 6th 2025</p>
              
              <p className="mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300">
                Veritas Vertex Consulting LLC ("us", "we", or "our") operates the EasyFund.me website (the "Service").
                This page informs you of our policies regarding the collection, use and disclosure of Personal Information when you use our Service.
                We will not use or share your information with anyone except as described in this Privacy Policy.
                We use your Personal Information for providing and improving the Service. By using the Service, you agree to the collection and use of information in accordance with this policy. Unless otherwise defined in this Privacy Policy, terms used in this Privacy Policy have the same meanings as in our Terms and Conditions.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 hover:text-gray-900 dark:hover:text-white">Information Collection And Use</h2>
              <p className="mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300">
                While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you. Personally identifiable information may include, but is not limited to, your email address, name, phone number, postal address, other information ("Personal Information").
                We collect this information for the purpose of providing the Service, identifying and communicating with you, responding to your requests/inquiries, servicing your purchase orders, and improving our services.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 hover:text-gray-900 dark:hover:text-white">Log Data</h2>
              <p className="mb-4 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300">
                We may also collect information that your browser sends whenever you visit our Service ("Log Data"). This Log Data may include information such as your computer's Internet Protocol ("IP") address, browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages and other statistics.
              </p>
              <p className="mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300">
                In addition, we may use third party services such as Google Analytics, Google AdWords and Google Remarketing that collect, monitor and analyze this type of information in order to increase our Service's functionality. These third party service providers have their own privacy policies addressing how they use such information.
                If you'd like to opt out of being tracked by Google's services, we encourage you to use the Google Analytics Opt-out Browser Add-on.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 hover:text-gray-900 dark:hover:text-white">Cookies</h2>
              <p className="mb-4 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300">
                Cookies are files with a small amount of data, which may include an anonymous unique identifier. Cookies are sent to your browser from a web site and transferred to your device. We use cookies to collect information in order to improve our services for you.
              </p>
              <p className="mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300">
                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. The Help feature on most browsers provides information on how to accept cookies, disable cookies or to notify you when receiving a new cookie.
                If you do not accept cookies, you may not be able to use some features of our Service and we recommend that you leave them turned on.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 hover:text-gray-900 dark:hover:text-white">Service Providers</h2>
              <p className="mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300">
                We may employ third party companies and individuals to facilitate our Service, to provide the Service on our behalf, to perform Service-related services and/or to assist us in analyzing how our Service is used.
                These third parties have access to your Personal Information only to perform specific tasks on our behalf and are obligated not to disclose or use your information for any other purpose.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 hover:text-gray-900 dark:hover:text-white">Communications</h2>
              <p className="mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300">
                We may use your Personal Information to contact you with newsletters, marketing or promotional materials and other information that may be of interest to you. You may opt out of receiving any, or all, of these communications from us by following the unsubscribe link or instructions provided in any email we send.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 hover:text-gray-900 dark:hover:text-white">Compliance With Laws</h2>
              <p className="mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300">
                We will disclose your Personal Information where required to do so by law or subpoena or if we believe that such action is necessary to comply with the law and the reasonable requests of law enforcement or to protect the security or integrity of our Service.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 hover:text-gray-900 dark:hover:text-white">Security</h2>
              <p className="mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300">
                The security of your Personal Information is important to us, and we strive to implement and maintain reasonable, commercially acceptable security procedures and practices appropriate to the nature of the information we store, in order to protect it from unauthorized access, destruction, use, modification, or disclosure.
                However, please be aware that no method of transmission over the internet, or method of electronic storage is 100% secure and we are unable to guarantee the absolute security of the Personal Information we have collected from you.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 hover:text-gray-900 dark:hover:text-white">International Transfer</h2>
              <p className="mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300">
                Your information, including Personal Information, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from your jurisdiction.
                If you are located outside United States and choose to provide information to us, please note that we transfer the information, including Personal Information, to United States and process it there.
                Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 hover:text-gray-900 dark:hover:text-white">Links To Other Sites</h2>
              <p className="mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300">
                Our Service may contain links to other sites that are not operated by us. If you click on a third party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.
                We have no control over, and assume no responsibility for the content, privacy policies or practices of any third party sites or services.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 hover:text-gray-900 dark:hover:text-white">Children's Privacy</h2>
              <p className="mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300">
                Only persons age 18 or older have permission to access our Service. Our Service does not address anyone under the age of 13 ("Children").
                We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and you learn that your Children have provided us with Personal Information, please contact us. If we become aware that we have collected Personal Information from a children under age 13 without verification of parental consent, we take steps to remove that information from our servers.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 hover:text-gray-900 dark:hover:text-white">Changes To This Privacy Policy</h2>
              <p className="mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300">
                This Privacy Policy is effective as of June 6th 2025 and will remain in effect except with respect to any changes in its provisions in the future, which will be in effect immediately after being posted on this page.
                We reserve the right to update or change our Privacy Policy at any time and you should check this Privacy Policy periodically. Your continued use of the Service after we post any modifications to the Privacy Policy on this page will constitute your acknowledgment of the modifications and your consent to abide and be bound by the modified Privacy Policy.
                If we make any material changes to this Privacy Policy, we will notify you either through the email address you have provided us, or by placing a prominent notice on our website.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 hover:text-gray-900 dark:hover:text-white">Contact Us</h2>
              <p className="mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300">
                If you have any questions about this Privacy Policy, please contact us on our Help Center page.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
