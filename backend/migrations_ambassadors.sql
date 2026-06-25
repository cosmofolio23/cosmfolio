-- Create ambassadors table
CREATE TABLE IF NOT EXISTS public.ambassadors (
    user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    referral_code TEXT UNIQUE NOT NULL,
    tier TEXT NOT NULL DEFAULT 'starter',
    successful_sales INT NOT NULL DEFAULT 0,
    discount_percentage INT NOT NULL DEFAULT 15,
    commission_percentage INT NOT NULL DEFAULT 15,
    total_earnings NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    pending_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    available_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    withdrawn_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for ambassadors
ALTER TABLE public.ambassadors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of ambassadors" ON public.ambassadors
    FOR SELECT USING (true);

CREATE POLICY "Allow individual update of their own ambassador profile" ON public.ambassadors
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Allow individual insert of their own ambassador profile" ON public.ambassadors
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Create referral_transactions table
CREATE TABLE IF NOT EXISTS public.referral_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ambassador_id TEXT NOT NULL REFERENCES public.ambassadors(user_id) ON DELETE CASCADE,
    customer_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    payment_id TEXT,
    sale_amount NUMERIC(10, 2) NOT NULL,
    discount_given NUMERIC(10, 2) NOT NULL,
    commission_amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, available, withdrawn, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for referral_transactions
ALTER TABLE public.referral_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow ambassador to read own transactions" ON public.referral_transactions
    FOR SELECT USING (auth.uid()::text = ambassador_id);
