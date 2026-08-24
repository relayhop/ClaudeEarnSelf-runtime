class CultivationSkill:
    def __init__(self):
        self.level = 1

    def practice(self):
        self.level += 1
        return self.level
