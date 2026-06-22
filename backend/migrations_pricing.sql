-- Add pricing and boost pack columns to users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS region VARCHAR(10) DEFAULT 'IN',
  ADD COLUMN IF NOT EXISTS boost_pack_count INTEGER DEFAULT 0;

-- Migrate existing is_pro users to 'pro' plan
UPDATE public.users SET plan_type = 'pro' WHERE is_pro = true;

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    product_type VARCHAR(50) NOT NULL, -- 'pro_upgrade', 'boost_pack'
    amount INTEGER NOT NULL,
    currency VARCHAR(10) NOT NULL,
    gateway_order_id VARCHAR(100),
    gateway_payment_id VARCHAR(100),
    status VARCHAR(20) NOT NULL, -- 'created', 'paid', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_gateway_order_id ON public.transactions(gateway_order_id);
