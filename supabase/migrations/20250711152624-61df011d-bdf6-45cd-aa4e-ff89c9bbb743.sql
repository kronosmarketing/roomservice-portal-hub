
-- Create daily_closures table to store closure information
CREATE TABLE public.daily_closures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  closure_date DATE NOT NULL,
  total_orders INTEGER NOT NULL DEFAULT 0,
  completed_orders INTEGER NOT NULL DEFAULT 0,
  cancelled_orders INTEGER NOT NULL DEFAULT 0,
  deleted_orders INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  payment_methods_detail JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one closure per hotel per date
  UNIQUE(hotel_id, closure_date)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.daily_closures ENABLE ROW LEVEL SECURITY;

-- Create policy for hotel access
CREATE POLICY "daily_closures_access" 
  ON public.daily_closures 
  FOR ALL 
  USING (user_has_hotel_access(hotel_id))
  WITH CHECK (hotel_id = get_current_user_hotel_id());

-- Add index for better performance
CREATE INDEX idx_daily_closures_hotel_date ON public.daily_closures(hotel_id, closure_date DESC);

-- Add foreign key constraint
ALTER TABLE public.daily_closures 
ADD CONSTRAINT fk_daily_closures_hotel_id 
FOREIGN KEY (hotel_id) REFERENCES public.hotel_user_settings(id);
