# Turrets DCA and Stop-Loss Automation Configuration

This document specifies concrete JSON configurations and parameter definitions for deploying Dollar-Cost Averaging (DCA) and Stop-Loss automation contracts via the Stellar Turrets deployment API in `Stellar-MicroPay`.

---

## 1. Dollar-Cost Averaging (DCA) Configuration

### Objective
Automate recurring market purchases of XLM utilizing 10 USDC every 60 minutes.

### Deployment API Payload (`POST /api/turrets/deploy`)

```json
{
  "strategy": "dollar_cost_averaging",
  "version": "1.0.0",
  "network": "testnet",
  "networkPassphrase": "Test SDF Network ; September 2015",
  "turretEndpoint": "https://turret-01.stellar-micropay.testnet.internal/tx/create",
  "sourceAccount": "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  "parameters": {
    "intervalMinutes": 60,
    "amountQuote": "10.0000000",
    "quoteAsset": {
      "code": "USDC",
      "issuer": "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
    },
    "baseAsset": {
      "code": "XLM",
      "issuer": null
    },
    "maxSlippageBps": 100,
    "executionPath": [
      "USDC",
      "XLM"
    ]
  },
  "schedule": {
    "cron": "0 * * * *",
    "active": true
  }
}
```

---

## 2. Stop-Loss Liquidation Configuration

### Objective
Monitor the XLM/USDC market pair and execute an immediate total balance liquidation into USDC if the unit price falls below 0.09 USDC.

### Deployment API Payload (`POST /api/turrets/deploy`)

```json
{
  "strategy": "stop_loss_liquidation",
  "version": "1.0.0",
  "network": "testnet",
  "networkPassphrase": "Test SDF Network ; September 2015",
  "turretEndpoint": "https://turret-01.stellar-micropay.testnet.internal/tx/create",
  "sourceAccount": "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  "parameters": {
    "baseAsset": {
      "code": "XLM",
      "issuer": null
    },
    "quoteAsset": {
      "code": "USDC",
      "issuer": "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
    },
    "stopLossPrice": "0.0900000",
    "liquidationMode": "full_balance",
    "oracleContract": "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
    "oracleTolerableDelaySeconds": 180
  },
  "monitoring": {
    "pollIntervalSeconds": 30,
    "active": true
  }
}
```

---

## 3. Parameter Reference

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `intervalMinutes` | Integer | Yes | Frequency of recurring trade execution in minutes. Set to `60` for hourly cycles. |
| `amountQuote` | String (Decimal) | Yes | Fixed quote asset allocation per execution cycle. Formatted to 7 decimal places (`10.0000000`). |
| `quoteAsset` | Object | Yes | Asset disbursed to fund the purchase or received during liquidation. Contains `code` and `issuer`. |
| `baseAsset` | Object | Yes | Target asset acquired or monitored for liquidation. Native XLM uses `issuer: null`. |
| `stopLossPrice` | String (Decimal) | Yes | Price floor trigger threshold. Liquidation executes if `market_price <= stopLossPrice`. |
| `liquidationMode` | String | Yes | Scope of liquidation. Allowed values: `full_balance` or `partial_fixed`. |
| `maxSlippageBps` | Integer | No | Maximum allowable slippage in basis points (100 bps = 1.00%). |
| `oracleContract` | String (StrKey) | Yes | Soroban Oracle contract address publishing trusted price feeds. |
| `turretEndpoint` | String (URL) | Yes | Secure HTTPS endpoint of the signer turret executing automated signing. |

---

## 4. Operational Boundaries and Known Limitations

1. **Testnet Operation Only**: The Turrets automation engine and smart contract signers are presently deployed on the Stellar Testnet (`Test SDF Network ; September 2015`). Deploying against Public Mainnet without contract audit is strictly prevented.
2. **Manual Turret Escrow Funding**: Turret signers do not sponsor transaction fees. Account owners must maintain sufficient XLM reserves (minimum 2.5 XLM) in the contract account to cover sequence numbers and network fees.
3. **Oracle Delay Tolerances**: Triggers evaluate on discrete intervals (30-second poll cycles). High volatility events exceeding `oracleTolerableDelaySeconds` will trigger defensive execution stalls rather than unverified swaps.
