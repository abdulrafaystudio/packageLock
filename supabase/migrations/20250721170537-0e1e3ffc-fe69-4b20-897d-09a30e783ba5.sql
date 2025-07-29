-- Remove the "Relja Test" investor from the investors table
DELETE FROM public.investors 
WHERE id = 'e81d7485-0cb8-4b1e-b283-cf815e020019' 
AND investor_name = 'Relja Test';