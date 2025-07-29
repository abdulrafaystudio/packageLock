export interface LibraryTopic {
  id: string;
  title: string;
  content: string;
  category: 'getting-started' | 'account' | 'features' | 'billing';
}

export const libraryTopics: LibraryTopic[] = [
  {
    id: 'create-account',
    title: 'How to Create Your Account',
    content: `Creating an account on EasyFund is quick and easy. Whether you're a company, broker, or just exploring opportunities, your journey starts with a few simple steps. Click the "Sign Up" or "Get Started" on the homepage. It will take you to the pricing page where you can choose the package that best suits your needs.

Next, fill in your name, email address, and password. You can add your company name but that's optional. Once you submit your info, we'll send you a verification email. Just click the link inside to activate your account. This helps us keep the platform secure and free of spam. Once you're verified, you'll be directed to your profile dashboard where you can start setting up your page, post your first deal, or begin browsing the platform.

No technical skills required - the interface is simple and intuitive. If you ever get stuck, our "How it Works" page is available with a step-by-step walkthrough, and our support team is always ready to help via email. Signing up is free, and you can upgrade to a premium plan later whenever you're ready to unlock more features. EasyFund was built to help you take action fast, and it all starts here.`,
    category: 'getting-started'
  },
  {
    id: 'navigate-pages',
    title: 'Navigating the Companies & Investors Pages',
    content: `EasyFund's platform is built to help you discover opportunities and connect efficiently. You'll spend most of your time on two key pages: the Companies Page and the Investors Page.

The Companies Page lists all the active deals posted by companies and brokers. You can filter by location, industry, or deal type (Raising Capital, Selling, or Crowdfunding), and there's also a search bar to help you quickly find relevant opportunities. Each listing shows a preview - including the deal title, industry, funding target or asking price, and location. To view full deal details and to contact companies, you need to be logged in.

The Investors Page is accessible only to users on Premium or PremiumPro plans. It allows you to browse verified investor profiles and connect with them directly. You can filter investors by country, industry, and use the search bar to find investors by name or keyword. Each investor profile includes details such as preferred investment type, sectors, and verticals - giving you everything you need to identify a strong match.

Both pages are mobile-responsive, so you can manage your outreach from anywhere. Whether you're scouting your next investor or evaluating a deal, navigation is fast, intuitive, and built for action.`,
    category: 'getting-started'
  },
  {
    id: 'dashboard-deal-types',
    title: 'Understanding Your Dashboard and Deal Types',
    content: `Your EasyFund dashboard is your command center - it gives you full control over your profile, deals, subscriptions, and investor communications. The layout is clean and easy to navigate, helping you focus on what matters most: getting your deal in front of the right people.

From your dashboard, you can:
•	Post new deals
•	Edit or update existing ones
•	View and manage your subscription
•	Track which investors you've contacted (if you're on a Premium plan)
•	See all your listed deals in one place

When posting a deal, you'll be asked to select one of three deal types:
1.	Raising Capital - Best for startups and growth-stage companies seeking investment.
2.	Selling a Company - Ideal for founders or owners looking for a full or partial exit.
3.	Crowdfunding - For campaigns already live on external platforms but seeking more exposure.

Each deal type has required and optional fields, which are clearly marked. You'll find that the more information you include (like financials, valuation, or video pitch), the more attractive your deal becomes to investors. You can also update or edit your deals at any time directly from your dashboard.

Overall, your dashboard is designed to be your home base - organized, efficient, and ready to help you move forward quickly.`,
    category: 'getting-started'
  },
  {
    id: 'subscription-tiers',
    title: 'Understanding Subscription Tiers',
    content: `EasyFund offers two tailored subscription paths - one for Companies and another for Brokers/Advisors - each designed to match your needs at every stage of your capital-raising journey.

For Companies:
•	Free Package: Lets you create a profile and browse other companies.
•	Standard Package: Everything in Free, plus the ability to post one active deal.
•	Premium Package: Unlocks unlimited investor access - search, filter, and message as many verified investors as you want.

For Brokers/Advisors:
•	Free Package: Same as companies - create a profile and explore.
•	Enterprise Package: Post unlimited deals on behalf of clients - perfect for advisors with multiple listings.
•	PremiumPro Package: Includes everything in Enterprise, plus full access to the investor directory and unlimited investor messaging.

You can upgrade or downgrade at any time from your profile. If you upgrade, you'll only pay the difference, and if you downgrade, your current features will remain active until the end of the billing cycle.

There are no contact limits for Premium and PremiumPro users - reach out to as many investors as you like, as often as you like. Our subscription structure is built to give you flexibility and control, no matter your goals.`,
    category: 'getting-started'
  },
  {
    id: 'startups-raise-capital',
    title: 'How Startups Raise Capital on EasyFund',
    content: `Raising capital can be one of the most important - and stressful - parts of building a startup. EasyFund is designed to simplify that process and get your company in front of the right investors, faster. Whether you're bootstrapping your first product or ready to scale with a Seed or Series A round, the platform gives you the tools to present your business clearly and attract serious interest.

Start by selecting "Raising Capital" as your deal type when posting. Fill out the required fields such as your company name, industry, country, year founded, and how much capital you're seeking. You'll also be asked to explain why you're raising funds - this is your chance to share your vision and growth plans.

Want to increase your chances of success? Add optional details like revenue, valuation, EBITDA, or a short video pitch. The more confidence you can build, the more likely investors are to engage. Once your deal is live, it appears on the Companies page for all logged-in users to browse. If you're on a Premium plan, you can also search for investors directly and message them - without limits.

EasyFund helps startups level the playing field. Whether you're a first-time founder or a seasoned operator, the platform makes it easier to be discovered, tell your story, and get funded.`,
    category: 'features'
  },
  {
    id: 'promote-crowdfunding',
    title: 'How to Promote Your Crowdfunding Campaign',
    content: `Crowdfunding is a great way to build momentum, generate buzz, and gather early-stage capital. EasyFund gives your crowdfunding campaign a boost by placing it in front of a curated, investment-focused audience - not just general consumers.

To get started, choose "Crowdfunding" as your deal type when creating your post. You'll enter core details like your title, industry, description, and funding goal. Most importantly, you'll provide the link to your live crowdfunding campaign (Kickstarter, Indiegogo, Wefunder, etc.). This is what connects interested viewers on EasyFund to your active raise.

You can also include optional data like revenue, valuation, and a short video to build credibility. Even though crowdfunding is more public-facing, investors still want to see traction and clarity. Think of your EasyFund post as the elevator pitch that gets them to click through.

Crowdfunding deals appear alongside capital-raising and acquisition opportunities on the Companies page. If you're on a Premium plan, you can also proactively message investors who have a history of backing similar campaigns or industries. It's a smart way to expand your campaign's reach without relying solely on paid ads or social sharing.`,
    category: 'features'
  },
  {
    id: 'smb-businesses',
    title: 'Why EasyFund Works for Small & Medium-Size Businesses',
    content: `Raising funds or selling a business isn't just for Silicon Valley startups - it's something thousands of small and medium-sized businesses (SMBs) need to do every year. EasyFund is built with SMBs in mind, giving you a professional, cost-effective way to access investors without needing an expensive consultant or complicated process.

If you're looking to expand, launch a new product line, or bring on a strategic partner, you can post a Raising Capital deal to attract investors aligned with your goals. If you're ready to step away from the business or sell part of it, the Selling a Company deal type allows you to present your offer clearly and privately to serious buyers.

SMBs can often feel overlooked in the venture world, but on EasyFund, they stand out. Investors using the platform are diverse - from angel investors and private equity firms to family offices - and many are actively looking for stable, cash-flowing businesses to support or acquire. EasyFund gives SMBs flexibility, exposure, and simplicity all in one place.`,
    category: 'features'
  },
  {
    id: 'financial-advisors-brokers',
    title: 'Using EasyFund as a Financial Advisor or Broker',
    content: `If you're a financial advisor, M&A consultant, or investment broker, EasyFund is a powerful platform that lets you manage multiple client deals in one place - while keeping control and confidentiality intact. You don't need to create a separate account for each client. Instead, just sign up as a broker and use your single dashboard to post, edit, and track as many deals as you need.

Start with the Enterprise package to gain access to unlimited deal posting. This is perfect if you're managing portfolios or representing multiple companies that are raising capital or looking to sell. If you also want to connect with investors proactively, upgrade to the PremiumPro package to unlock investor search and direct messaging.

When posting a deal, you can choose how much or how little information to reveal. Some brokers post only basic details to gauge interest, then share deeper insights once a serious investor makes contact. All investor replies will come to the email address associated with your account, so you stay in the loop at all times.

You can also keep track of which investors you've contacted directly in your dashboard. EasyFund is here to support your workflow, protect your client data, and expand your network with ease.`,
    category: 'features'
  },
  {
    id: 'posting-first-deal',
    title: 'Posting Your First Deal (Capital, Sale, or Crowdfunding)',
    content: `Posting your first deal on EasyFund is a major step toward reaching the right investors or buyers. Whether you're raising capital, selling your company, or promoting a crowdfunding campaign, the process is simple and guided.

To start, head to your dashboard and click "Create Deal." You'll be asked to choose one of three deal types:
•	Raising Capital - for companies looking for investment to scale
•	Selling - for founders or owners seeking to sell part or all of a company
•	Crowdfunding - for live campaigns you want to promote to a wider audience

Each deal type has its own required fields like title, industry, year founded, and either a funding target or asking price. You'll also need to add a description and explain why you're raising funds or selling the business. For crowdfunding, you'll enter the link to your campaign.

There are also optional fields that can significantly increase interest: revenue, valuation, growth metrics, patents, and even a pitch video. These extras help investors better understand your opportunity and build trust. Once posted, your deal appears publicly on the Companies page, and logged-in users can view full details.

Need to make changes? You can edit your deal anytime from your profile page. EasyFund is here to make sure your deal looks its best and reaches the right audience.`,
    category: 'features'
  },
  {
    id: 'editing-updating-deal',
    title: 'Editing or Updating a Deal',
    content: `Markets change, businesses evolve and that's why you can edit or update your deal anytime. Whether you're adjusting your funding target, updating company performance, or simply improving the wording of your pitch, EasyFund makes it easy.

To make changes, log into your account and go to your profile page. Find the deal you want to modify and click the "Edit Deal" button. You'll see the same fields you filled out when posting - simply update what's needed and click "Save." Your edits will go live instantly.

Some founders update their deals regularly to reflect new traction, improved revenue, or milestones achieved. This helps keep your listing fresh and engaging. If your funding goal or asking price changes, that's okay too - investors want transparency and up-to-date information.

You can also add a video link or revise your description to make your opportunity clearer or more compelling. There's no limit to how many times you can edit a deal, so don't worry about getting it perfect the first time. Think of your listing as a living document - one you can tweak as your business grows or your strategy evolves.`,
    category: 'features'
  },
  {
    id: 'access-contact-investors',
    title: 'How to Access and Contact Investors',
    content: `Reaching out to investors is one of the most powerful features on EasyFund - and it's only available on the Premium and PremiumPro plans. Once you're subscribed, you'll get full access to the Investors Page, where you can browse thousands of verified investor profiles from around the world.

You can search for investors using filters like country, industry, or use the keyword search to find investors by name, sector focus, or investment interest. Each investor profile provides insight into their preferred deal types, sectors they're active in, and other helpful details to help you decide if they're the right fit.

When you find someone you'd like to connect with, you can email them through the platform. Your message will be sent directly to the investor's email, and if they're interested, they'll reply to you directly. Their contact information is also available on the investor's profile page and you can email them directly if you think this is better option for you. Have in mind that if you do this, they will not show on your dashboard as a contacted investor. There are no limits on how many investors you can message - the system is designed for proactive outreach.

To stay organized, you can view a history of the investors you've contacted from your dashboard. This lets you keep track of conversations and follow-ups. With EasyFund, you're not waiting to be discovered - you're empowered to take the first step and connect with the right people.`,
    category: 'features'
  },
  {
    id: 'what-investors-look-for',
    title: 'What Investors Look for in a Deal',
    content: `Investors are busy people - but they're also always on the hunt for great opportunities. What makes them stop, read, and reach out? It comes down to clarity, credibility, and potential.

Your deal listing should clearly explain what your company does, how it makes money (or will), and what you're seeking. Be honest and specific about your funding target or asking price, and explain why you're raising or why you're selling. Avoid buzzwords - use real, tangible language that builds trust.

Financials go a long way. Even if your company is early-stage, sharing key numbers like gross revenue, EBITDA, or valuation shows you're prepared and transparent. If you have growth milestones, customer wins, or patents, be sure to include them.

Investors also value presentation. A clean, well-written description and a short video pitch can make your deal stand out. If they feel like you've put thought into your listing, they're more likely to take the next step.

And remember - they don't just invest in ideas; they invest in people. Let your passion and purpose come through in your listing. That human touch can be the reason someone says yes.`,
    category: 'features'
  },
  {
    id: 'getting-more-visibility',
    title: 'Tips for Getting More Visibility',
    content: `Getting your deal in front of the right people is key - and EasyFund gives you the tools to do just that. But visibility isn't just about posting a deal and hoping for the best. Here are a few proven tips to help you stand out and attract investor attention.

Start with a strong title. Make it clear, concise, and compelling. Instead of "Tech Startup," try "AI-Powered Hiring Platform for SMBs." Let investors know what you're offering right away. Your description should tell a story - explain what the business does, why it matters, and where you're headed next.

Adding a video is a powerful way to build trust and interest. Even a short 1–2 minute clip explaining your vision can humanize your pitch and create connection. Also, include as much optional info as you're comfortable sharing - things like revenue, EBITDA, and growth projections go a long way.

Make sure your profile is fully filled out and current. Incomplete profiles get skipped. If you're on a Premium plan, don't just wait for investors to find you - go find them. Reach out directly with personalized messages and follow up when appropriate.

Finally, update your deal regularly. Fresh activity boosts visibility. Post traction updates, funding progress, or new milestones to keep your listing relevant. EasyFund is designed to reward momentum - show that you're active, engaged, and ready for serious conversations.`,
    category: 'features'
  },
  {
    id: 'keeping-sensitive-info-private',
    title: 'Keeping Sensitive Company Info Private',
    content: `We understand - not every detail should be public right away. That's why EasyFund is designed to give you full control over what you choose to share, and when. Whether you're raising capital or selling your business, you can keep sensitive information private until the right investor reaches out.

When posting your deal, required fields focus on the basics: title, year founded, industry, and funding goal or asking price. You are free to omit optional information like company name, valuation, financials, or IP details if you're not ready to share them publicly.

You can also phrase descriptions strategically. Instead of naming your business, use something like: "Fast-growing SaaS company based in New York." This keeps things anonymous while still communicating value. Once an investor contacts you and expresses interest, you're free to share more details directly.

Investor messages go to your email - so you decide who to respond to and when. You're always in control of the dialogue, and you can ask investors to sign an NDA before disclosing deeper data if needed.

EasyFund is about flexibility and transparency - on your terms. You can build visibility while staying protected, and we're here to support that balance every step of the way.`,
    category: 'features'
  },
  {
    id: 'post-deals-as-broker',
    title: 'How to Post Deals as a Broker or Advisor',
    content: `If you're representing multiple clients, EasyFund makes it incredibly easy to post and manage deals from one central profile. Whether you're an M&A advisor, financial consultant, or investment broker, the platform is built to support how you work.

Start by signing up and selecting the Enterprise or PremiumPro plan. From your dashboard, click "Post a Deal" and choose the appropriate type: Raising Capital, Selling, or Crowdfunding. You'll be able to post unlimited deals - each one representing a different client, company, or opportunity.

When posting, you can include as much or as little detail as you want. Some brokers choose to keep company names confidential and use generic descriptors like "Medical Device Firm in California." This helps maintain privacy while still attracting the right investor attention.

All deals are organized in your dashboard. You can edit them anytime, update key details, or remove them if needed. Inquiries from investors will go to the email linked to your broker profile, so you stay in control of the relationship.

There's no need to create multiple logins or manage multiple accounts. One profile, unlimited deals, total flexibility. EasyFund is designed to work the way brokers do.`,
    category: 'features'
  },
  {
    id: 'unlimited-deal-posting',
    title: 'Unlimited Deal Posting Explained',
    content: `With the Enterprise and PremiumPro plans, brokers and advisors unlock unlimited deal posting - giving you the flexibility to represent multiple clients at once, without ever needing to juggle separate accounts.

What does "unlimited" really mean? It means you can post as many active listings as you need, for as many clients or opportunities as you're handling. There's no limit on how many are live at once, and you can update, edit, or archive them whenever you want from your dashboard.

Each deal is treated independently on the Companies Page, meaning your clients' listings each get their own space and visibility. You can tailor each post with custom titles, descriptions, pricing, and financial info - or keep things anonymous depending on your strategy.

This is especially useful for firms that represent startups, family-owned businesses, or portfolio companies. Whether you're raising capital for five clients or managing ten sell-side opportunities, EasyFund adapts to your workload.

All investor inquiries go to the broker's designated email, so communication remains centralized. If you're serious about growing your network and deal flow, unlimited deal posting gives you the bandwidth and freedom to scale.`,
    category: 'features'
  },
  {
    id: 'using-filters-for-clients',
    title: 'Using Filters to Find the Right Investors for Each Client',
    content: `Finding the right investor can make or break a deal - and with EasyFund's smart filters, brokers and companies can streamline the search process to focus on serious, qualified prospects. This feature is available to Premium and PremiumPro subscribers, giving you full access to a curated list of verified investors from around the world.

Start by heading to the Investors Page. You can narrow your search by country, industry, or use the search bar to find investors by name or keyword (e.g., "Fintech," "Healthcare," or "Series A"). These filters help you zero in on investors who are aligned with your client's sector, stage, or geography.

Each investor profile includes details like preferred investment type, focus areas, and occasionally, notes on deal sizes or past investments. This allows you to match each client with the most relevant leads.

If you're representing multiple clients, these filters can save you hours of browsing. For example, looking for biotech investors in Europe? Just set your filters and review targeted profiles. Found a potential match? Contact investor to start the conversation.

Smart search isn't just about speed - it's about finding better-fit investors and increasing your chances of closing a deal.`,
    category: 'features'
  },
  {
    id: 'responding-to-inquiries',
    title: 'Responding to Investor Inquiries as a Broker',
    content: `When an investor is interested in one of your deals, they'll reach out to you directly via the email connected to your EasyFund account. As a broker or advisor, you're the main point of contact - and that gives you control over how the conversation unfolds.

Once you receive an inquiry, it's best to respond promptly - ideally within 24 hours. Introduce yourself, thank them for their interest, and offer to schedule a call or share more details. You can also decide if you want to loop in the client at that point or continue handling the dialogue yourself.

If the investor wants more information, you're free to share confidential documents, pitch decks, or financials just make sure you're comfortable with their level of interest and reputation. Feel free to request an NDA before sharing sensitive data. This will not be done under the supervision of EasyFund so we advise safety and security first.

Keeping responses professional but personable is key. You're not just representing the deal - you're also building rapport. If a deal isn't a fit, thank them for their time and keep the door open for future collaboration. Every interaction counts.`,
    category: 'features'
  },
  {
    id: 'connecting-clients-investors',
    title: 'Connecting Clients with Investors',
    content: `One of the most powerful things you can do as a broker on EasyFund is help your clients make meaningful investor connections - and our tools are built to support that process end to end.

Once you've posted a client's deal, you can proactively search the investor database (with a PremiumPro plan) to find ideal matches. Use filters for industry, geography, or keywords, and review investor profiles for fit.

When you find someone aligned with your client's goals, you can send them a message. Your email address is the point of contact, so you can manage communication and protect your client's identity until there's real interest.

You control how introductions happen. Some brokers prefer to facilitate the entire deal process, while others loop in their client once a meeting is scheduled. EasyFund gives you the flexibility to work your way - whether that's full-service advisory or selective matchmaking.

At the end of the day, the value you offer clients is measured in results. EasyFund helps you deliver them with clarity, speed, and professionalism.`,
    category: 'features'
  }
];