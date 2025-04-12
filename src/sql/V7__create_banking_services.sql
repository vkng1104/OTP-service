-- Create account_balances table
CREATE TABLE public.account_balances (
    id UUID DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id UUID NOT NULL,
    balance BIGINT NOT NULL DEFAULT 0,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create transaction_history table
CREATE TABLE public.transaction_history (
    id UUID DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id UUID NOT NULL,
    amount BIGINT NOT NULL,
    currency TEXT NOT NULL,
    balance_before BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    reference_id UUID,
    transaction_type TEXT NOT NULL, -- 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER'
    description TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_account_balances_user_id_currency ON public.account_balances USING btree (user_id, currency);
CREATE INDEX IF NOT EXISTS idx_transaction_history_user_id_currency ON public.transaction_history USING btree (user_id, currency);
CREATE INDEX IF NOT EXISTS idx_transaction_history_user_id_currency_transaction_type ON public.transaction_history USING btree (user_id, currency, transaction_type);
