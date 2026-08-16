(function(global) {
    var Bounties = (function() {
        function parse(line) {
            var cols = line.split('\t').map(function(val, i) {
                return (i === 4) ? parseFloat(val) : val;
            });
            return {
                id: cols[0],
                asset: cols[1],
                amount: cols[2],
                period: cols[3],
                price: cols[4],
                title: cols[5],
                desc: cols[6],
                value: function() { return this.amount * this.price; }
            };
        }
        return {
            parse: parse,
            render: function(item) {
                return [item.id, item.asset, item.amount, item.period, item.price, item.title, item.desc].join('\t');
            }
        };
    })();

    var data = '1548616\tbitcoin\t1000\t15\t20.4\tOPEN_BOUNTY\tAsking 🤔 the stackers ⚡';
    var instance = Bounties.parse(data);

    if (global) global.Radar = instance;
    return instance;
})(typeof window !== 'undefined' ? window : this);