
-- Phase 2 of Cleanup: Standardize column names in the 'investors' table

ALTER TABLE public.investors RENAME COLUMN "Investor Name" TO investor_name;
ALTER TABLE public.investors RENAME COLUMN "Website" TO website;
ALTER TABLE public.investors RENAME COLUMN "Description" TO description;
ALTER TABLE public.investors RENAME COLUMN "Verticals" TO verticals;
ALTER TABLE public.investors RENAME COLUMN "Sectors" TO sectors;
ALTER TABLE public.investors RENAME COLUMN "Preferred Investment Types" TO preferred_investment_types;
ALTER TABLE public.investors RENAME COLUMN "Preferred Geographical Areas" TO preferred_geographical_areas;
ALTER TABLE public.investors RENAME COLUMN "Country" TO country;
ALTER TABLE public.investors RENAME COLUMN "Type" TO type;
ALTER TABLE public.investors RENAME COLUMN "Contact Name" TO contact_name;
ALTER TABLE public.investors RENAME COLUMN "Email" TO email;
ALTER TABLE public.investors RENAME COLUMN "Phone" TO phone;
ALTER TABLE public.investors RENAME COLUMN "Role" TO role;
