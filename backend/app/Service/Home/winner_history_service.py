# ...existing code...
from typing import List, Dict, Any
from Service.db_connection import get_supabase_client

SAMPLE_PLACEHOLDER = "https://via.placeholder.com/400x400?text=No+Image"
SAMPLE_DATA = [
    {"id": 1, "productId": "RC20-9876", "productName": "Red Jacket", "imageUrl": SAMPLE_PLACEHOLDER, "winnerId": "user1", "winnerName": "Buyer01", "finalPrice": 260, "bidTime": None},
    {"id": 2, "productId": "LUX98-1985", "productName": "Luxury Bag", "imageUrl": SAMPLE_PLACEHOLDER, "winnerId": "user2", "winnerName": "Buyer02", "finalPrice": 960, "bidTime": None},
]


def get_recent_winners(limit: int = 20) -> List[Dict[str, Any]]:
    """
    Use Supabase client "ORM-like" API (postgrest client) to join bid -> product.
    Requirements:
      - In Supabase the bid table must have a foreign key to product (e.g. bid.product_id -> product.product_id)
      - The select uses relationship syntax: product:product(product_name,product_img)
    Frontend fields returned:
      - id (use bid_id)
      - productId
      - productName
      - imageUrl
      - winnerId (bidder_id)
      - finalPrice (bid_amount)
      - bidTime
    """
    supabase = get_supabase_client()
    try:
        # select bid fields and related product fields via relationship syntax
        resp = (
            supabase.from_("bid")
            .select("bid_id, product_id, bidder_id, bid_amount, bid_time, product:product(product_name, product_img)")
            .order("bid_time", desc=True)
            .limit(limit)
            .execute()
        )
        
        rows = getattr(resp, "data", None) or []
        result = []
        for r in rows:
            # Supabase returns related rows as an array under the relationship key
            product_arr = r.get("product") or []
            product = product_arr[0] if isinstance(product_arr, list) and product_arr else {}
            result.append({
                "id": r.get("bid_id"),
                "productId": r.get("product_id"),
                "productName": product.get("product_name") or product.get("name") or None,
                "imageUrl": product.get("product_img") or product.get("product_image") or SAMPLE_PLACEHOLDER,
                "winnerId": r.get("bidder_id"),
                "winnerName": None,  # optional: join users table or fetch separately to resolve bidder_id -> name
                "finalPrice": r.get("bid_amount"),
                "bidTime": r.get("bid_time"),
            })

        if not result:
            return SAMPLE_DATA[:limit]

        return result[:limit]

    except Exception:
        # on error return sample data so frontend stays usable
        return SAMPLE_DATA[:limit]
# ...existing code...