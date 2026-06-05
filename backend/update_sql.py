import sys

path = r'c:\Users\praji\Pictures\Mini Project\mini code\backend\setup_billing.sql'
with open(path, 'r', encoding='utf-8') as f:
    orig = f.read()

new_table = """-- table: market_basket_recommendations
CREATE TABLE public.market_basket_recommendations (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    item_id text NOT NULL,
    recommended_item_id text NOT NULL,
    confidence integer NOT NULL,
    CONSTRAINT market_basket_pkey PRIMARY KEY (id),
    CONSTRAINT uk_market_basket UNIQUE (item_id, recommended_item_id)
);
"""

if "market_basket_recommendations" not in orig:
    orig += "\n" + new_table
    with open(path, 'w', encoding='utf-8') as f:
        f.write(orig)
    print("Added market_basket_recommendations to setup_billing.sql.")
else:
    print("Table already exists in setup_billing.sql")
