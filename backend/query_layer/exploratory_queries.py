def generate_context(df, item_id, context_data=None):
    if context_data is not None:
        row = context_data
    else:
        if df is None or df.empty:
            return "Insufficient data available"
        df_row = df[df["item_id"] == item_id]
        if df_row.empty:
            return "Item not found"
        row = df_row.iloc[0].to_dict()

    def format_int(val):
        import pandas as pd
        if pd.isna(val):
            return 'N/A'
        try:
            return int(round(float(val)))
        except (ValueError, TypeError):
            return val

    def format_float(val):
        import pandas as pd
        if pd.isna(val):
            return 'N/A'
        try:
            return round(float(val), 2)
        except (ValueError, TypeError):
            return val

    context = f"""Item ID: {item_id}
Final Demand: {format_int(row.get('final_demand', 'N/A'))}
Current Stock: {format_int(row.get('current_stock', 'N/A'))}
Safety Stock: {format_int(row.get('safety_stock', 'N/A'))}
Reorder Point: {format_int(row.get('reorder_point', 'N/A'))}
Reorder Quantity: {format_int(row.get('reorder_quantity', 'N/A'))}
Stockout Risk: {row.get('stockout_risk', 'N/A')}
Overstock Risk: {row.get('overstock_risk', 'N/A')}
Demand Trend: {row.get('demand_trend', 'N/A')}
Inventory Turnover: {format_float(row.get('inventory_turnover', 'N/A'))}
ABC Classification: {row.get('abc_classification', 'N/A')}"""

    return context

def generate_demand_plot(daily_sales, item_id):
    import matplotlib.pyplot as plt

    data = daily_sales[daily_sales["item_id"] == item_id]

    plt.plot(data["date"], data["quantity_sold"])
    plt.title(f"Demand Trend for Item {item_id}")
    plt.xlabel("Date")
    plt.ylabel("Quantity Sold")
    plt.show()

def fetch_chat_history(item_id):
    from supabase_client import supabase
    from datetime import date
    try:
        today_str = date.today().isoformat()
        res = supabase.table("exploratory_chat_history") \
            .select("question, answer, created_at, created_date") \
            .eq("item_id", item_id) \
            .eq("created_date", today_str) \
            .order("created_at", desc=False) \
            .execute()
        
        histories = res.data if res.data else []
        
        if not histories:
            return ""

        formatted = []
        for i, h in enumerate(histories, 1):
            formatted.append(f"Q{i}: {h['question']}\nA{i}: {h['answer']}")
        
        return "\n".join(formatted)
    except Exception as e:
        print(f"[Warning] Failed to fetch chat history: {e}")
        return ""

def insert_chat_history(item_id, question, answer):
    from supabase_client import supabase
    from datetime import date
    try:
        today_str = date.today().isoformat()
        supabase.table("exploratory_chat_history").insert({
            "item_id": item_id,
            "question": question,
            "answer": answer,
            "created_date": today_str
        }).execute()
    except Exception as e:
        print(f"[Warning] Failed to insert chat history: {e}")

def exploratory_query(df, item_id, user_query, llm=None, context_data=None):
    import requests

    context = generate_context(df, item_id, context_data)
    
    if context == "Item not found":
        return "Item not found"
    elif context == "Insufficient data available":
        return "Insufficient data available"

    formatted_history = fetch_chat_history(item_id)
    
    history_block = f"""Previous Conversation:
{formatted_history}

""" if formatted_history else ""

    prompt = f"""You are a strict, non-conversational inventory analysis AI.
{history_block}
STRICT RULES (VERY IMPORTANT):
1. Use EXACT Item ID provided in Data. DO NOT modify or shorten it (e.g., P001 -> P0 is WRONG). Always display the full correct ID.
2. Use ONLY the given Data. Do NOT assume anything. Do NOT add explanations beyond data.
3. Keep output SHORT and PRECISE. Maximum 4 points.
4. Each point MUST be exactly 1 single line. Maximum 12-15 words per line.
5. Do NOT use phrases like "as per policy", "this indicates that", "in conclusion", "despite", "suggesting that".

EXAMPLE OF EXPECTED REASONING:
Data:
Item ID: P001
Current Stock: 175
Reorder Point: 21
Overstock Risk: YES
Demand Trend: Increasing
Reorder Quantity: 0
Inventory Turnover: 0.02
Answer:
1. Inventory turnover is 0.02 for item P001.
2. Current stock (175) exceeds reorder point (21).
3. Overstock risk is YES, indicating excess inventory.
4. Reorder quantity is 0, so no restocking needed.

Data:
{context}

Question:
{user_query}

OUTPUT RULES:
* EXACTLY 3 or 4 points
* Start directly with numbered points. No paragraphs. No extra explanation.
* Each point must include at least one metric value
* Each point must be factual and direct
* No long sentences
* No multi-line points

FORMAT:
1. ...
2. ...
3. ..."""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "phi3",
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.2
                }
            }
        )
        response.raise_for_status()
        answer_text = response.json().get("response", "No response generated")
        
        insert_chat_history(item_id, user_query, answer_text)
        
        return answer_text
    except requests.exceptions.RequestException as e:
        return f"Error: Ollama API is not running or unreachable. Please start Ollama locally. ({str(e)})"
    except Exception as e:
        return f"Error generating insights: {str(e)}"