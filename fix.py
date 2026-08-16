(() => {
    class BountyEntry {
        constructor(line) {
            const fields = line.trim().split(/\t/);
            this.id = fields[0];
            this.type = fields[1];
            this.amount = Number(fields[2]);
            this.count = Number(fields[3]);
            this.ratio = Number(fields[4]);
            this.state = fields[5];
            this.label = fields.slice(6).join('\t').trim();
            this.isOpen = this.state === 'OPEN_BOUNTY';
        }
        getSummary() {
            return `${this.type} | ${this.amount} | ${this.state} | ${this.label}`;
        }
    }
    const rawString = "1548616\tbitcoin\t1000\t15\t19.2\tOPEN_BOUNTY\tAsking 🤔 the stackers ⚡";
    const entry = new BountyEntry(rawString);
    return {
        data: entry,
        parse: (line) => new BountyEntry(line),
        isReady: () => entry.isOpen
    };
})();