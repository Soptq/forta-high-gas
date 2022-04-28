# Dynamic High Gas Used / Gas Price Detection Agent

## Description

This agent detects unusual transactions with higher gas used or gas price. This bot does not use any external APIs. It categorizes data by `networkId`, `address`, and `signature` of the call method. That is, this bot will analyze the gas used / gas price trends of all methods of all contracts of all networks, and raise alerts if it finds a transaction calling a method of a contract has a higher gas used / gas price than the average of the same method.

Essentially, this bot uses moving average and moving variance to determine if a transaction is suspicious. You can tweak the sensitivity of this bot by adjusting variables in `src/agent.ts`, line 13 - 17.


## Supported Chains

- All chains that Forta supports.

## Alerts

Describe each of the type of alerts fired by this agent

- FORTA-1
  - Fired when a transaction has a high distance between its gas used value and the tracked value.
  - By default severity is always set to "low" if 5 < distance <= 10, "medium" if 10 < distance <= 15, and "high" if 15 < distance. These limits can be adjusted in `src/agent.ts`, line 13 - 17.
  - Type is always set to "suspicious"
  - Metadata fields contain the distance and the current gas used value.
- FORTA-2
  - Fired when a transaction has a high distance between its gas price value and the tracked value.
  - By default severity is always set to "low" if 5 < distance <= 10, "medium" if 10 < distance <= 15, and "high" if 15 < distance. These limits can be adjusted in `src/agent.ts`, line 13 - 17.
  - Type is always set to "suspicious"
  - Metadata fields contain the distance and the current gas price value.

## Test Data

As this bot identifies and tracks value in read time using time series (i.e. the results of the bot depend on many transactions), there is no specific tx that can be tested with. However, you can check the test scripts for mock data.
