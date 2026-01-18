-- Add Segment and Health Score to Clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS segment text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS health_score integer DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100);

-- Update existing clients with dummy data for immediate visual feedback
UPDATE public.clients SET segment = 'Premium', health_score = 95 WHERE segment IS NULL;
