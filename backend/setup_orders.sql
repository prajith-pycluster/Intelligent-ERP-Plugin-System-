-- table: customers
CREATE TABLE IF NOT EXISTS public.customers (
    customer_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    customer_name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT customers_pkey PRIMARY KEY (customer_id),
    CONSTRAINT uk_customer_name UNIQUE (customer_name)
);

-- table: orders
CREATE TABLE IF NOT EXISTS public.orders (
    order_id text NOT NULL, -- ORD-YYYYMMDD-Sequence
    customer_id uuid NULL,
    customer_name text NOT NULL,
    total_amount numeric(10,2) NOT NULL DEFAULT 0.00,
    status text NOT NULL DEFAULT 'Pending'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT orders_pkey PRIMARY KEY (order_id)
);

-- table: order_items
CREATE TABLE IF NOT EXISTS public.order_items (
    order_item_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    order_id text NOT NULL,
    product_id text NOT NULL,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT order_items_pkey PRIMARY KEY (order_item_id),
    CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE
);
