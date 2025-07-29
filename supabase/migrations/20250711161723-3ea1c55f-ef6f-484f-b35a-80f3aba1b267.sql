-- Add video_links column to deals table to support multiple video links
ALTER TABLE public.deals 
ADD COLUMN video_links TEXT;