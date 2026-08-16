const SN_652 = (() => {
    const data = {
        id: 1548616,
        asset: "bitcoin",
        amount: 1000,
        tier: 15,
        metric: 19.7,
        status: "OPEN_BOUNTY",
        message: "Asking 🤔 the stackers ⚡"
    };

    return {
        ...data,
        getStatus: () => data.status,
        getMetrics: () => data.metric,
        isOpen: () => data.status === "OPEN_BOUNTY"
    };
})();