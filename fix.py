(function() {
    const rawData = "1548616|bitcoin|1000|15|21.0|OPEN_BOUNTY|Asking 🤔 the stackers ⚡";
    const [
        id,
        asset,
        value,
        count,
        rate,
        type,
        ...desc
    ] = rawData.split("|");
    const bounty = {
        id,
        asset,
        value,
        count,
        rate,
        type,
        description: desc.join("|")
    };
    return bounty;
})();
module.exports = bounty;