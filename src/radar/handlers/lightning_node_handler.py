"""
Handler for Lightning Node OPEN_BOUNTY detected by radar.
"""
from typing import Dict, Any
from ..base import BountyHandler

class LightningNodeBountyHandler(BountyHandler):
    """Handles high-value Lightning Node bounties."""

    def can_handle(self, bounty_data: Dict[str, Any]) -> bool:
        tags = bounty_data.get("tags", [])
        return "OPEN_BOUNTY" in tags and "HOT" in tags and bounty_data.get("subject") == "bitcoin"

    def execute(self, bounty_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process the Lightning Node bounty."""
        amount = bounty_data.get("amount", 0)
        difficulty = bounty_data.get("difficulty", 0)
        
        # Calculate profitability score
        score = (amount / 1000) * (25 - difficulty)
        
        return {
            "status": "processed",
            "bounty_id": bounty_data.get("id"),
            "score": score,
            "action": "accept" if score > 50 else "monitor"
        }
