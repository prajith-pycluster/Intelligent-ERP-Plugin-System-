-- table: billing_master
CREATE TABLE public.billing_master (
    bill_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    customer_name text NULL,
    total_amount numeric(10,2) NOT NULL DEFAULT 0.00,
    status text NOT NULL DEFAULT 'draft'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT billing_master_pkey PRIMARY KEY (bill_id)
);

-- table: billing_items
CREATE TABLE public.billing_items (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    bill_id uuid NOT NULL,
    item_id text NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT billing_items_pkey PRIMARY KEY (id),
    CONSTRAINT billing_items_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.billing_master(bill_id) ON DELETE CASCADE
);

-- table: market_basket_recommendations
CREATE TABLE public.market_basket_recommendations (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    item_id text NOT NULL,
    recommended_item_id text NOT NULL,
    confidence integer NOT NULL,
    CONSTRAINT market_basket_pkey PRIMARY KEY (id),
    CONSTRAINT uk_market_basket UNIQUE (item_id, recommended_item_id)
);

-- table: item_history
CREATE TABLE public.item_history (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    item_id text NOT NULL,
    product_name text NOT NULL,
    quantity_added integer NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT item_history_pkey PRIMARY KEY (id)
);
