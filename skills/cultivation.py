"""Cultivation Skill Module.

Implements the core logic for the Cultivation skill,
allowing agents to accumulate experience and level up.
"""

class CultivationSkill:
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.experience = 0
        self.level = 1

    def gain_experience(self, amount: int) -> None:
        """Add experience and handle level up logic."""
        if amount < 0:
            raise ValueError("Experience gained cannot be negative.")
        self.experience += amount
        self._check_level_up()

    def _check_level_up(self) -> None:
        """Check if the agent has enough experience to level up."""
        required_exp = self.level * 100
        while self.experience >= required_exp:
            self.experience -= required_exp
            self.level += 1
            required_exp = self.level * 100

    def get_status(self) -> dict:
        """Return the current cultivation status."""
        return {
            "agent_id": self.agent_id,
            "level": self.level,
            "experience": self.experience,
            "next_level_exp": self.level * 100
        }
