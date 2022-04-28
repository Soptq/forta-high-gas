import {
    getTransactionReceipt,
    BlockEvent,
    Finding,
    FindingSeverity,
    FindingType,
    HandleBlock,
    TransactionEvent,
} from "forta-agent";

import GasHistory from "./history";

const alpha = 0.05;
const normalLimit = BigInt(5); // if distance < 5, it's normal
const lowSeverityLimit = BigInt(10); // if distance < 10, it's low severity
const midSeverityLimit = BigInt(15); // if distance < 15, it's high severity
// others are high severity

const gasUsedHistory = new GasHistory(alpha);
const gasPriceHistory = new GasHistory(alpha);
let findingsCount = 0;

const getSignature = (data: string): string => {
  const length = data.startsWith('0x') ? 10 : 8
  return data.slice(0, length)
}

function provideHandleTransaction(getTransactionReceipt: CallableFunction) {
    return async function (
        txEvent: TransactionEvent
    ) {
        const findings: Finding[] = [];

        // limiting this agent to emit only 5 findings so that the alert feed is not spammed
        if (findingsCount >= 5) return findings;
        if (!txEvent.transaction.to) return findings;

        // extract data for analysis
        const network = txEvent.network.toString();
        const toAddress = txEvent.transaction.to.toString();
        const signature = getSignature(txEvent.transaction.data);
        const gasUsed = BigInt((await getTransactionReceipt(txEvent.hash)).gasUsed);
        const gasPrice = BigInt(txEvent.transaction.gasPrice);

        const gasUsedDistance = gasUsedHistory.getDistance(
            network,
            toAddress,
            signature,
            gasUsed
        );

        const gasPriceDistance = gasPriceHistory.getDistance(
            network,
            toAddress,
            signature,
            gasPrice
        );

        if (normalLimit < gasUsedDistance && gasUsedDistance <= lowSeverityLimit) {
            findings.push(
                Finding.fromObject({
                    name: "High Gas Used",
                    description: `Gas used in transaction ${txEvent.transaction.hash} is ${gasUsed.toString()}`,
                    alertId: "FORTA-1",
                    severity: FindingSeverity.Low,
                    type: FindingType.Suspicious,
                    metadata: {
                        gasUsed: gasUsed.toString(),
                        distance: gasUsedDistance.toString(),
                    },
                }),
            );
            findingsCount++;
        }
        if (lowSeverityLimit < gasUsedDistance && gasUsedDistance <= midSeverityLimit) {
            findings.push(
                Finding.fromObject({
                    name: "High Gas Used",
                    description: `Gas used in transaction ${txEvent.transaction.hash} is ${gasUsed.toString()}`,
                    alertId: "FORTA-1",
                    severity: FindingSeverity.Medium,
                    type: FindingType.Suspicious,
                    metadata: {
                        gasUsed: gasUsed.toString(),
                        distance: gasUsedDistance.toString(),
                    },
                }),
            );
            findingsCount++;
        }
        if (midSeverityLimit < gasUsedDistance) {
            findings.push(
                Finding.fromObject({
                    name: "High Gas Used",
                    description: `Gas used in transaction ${txEvent.transaction.hash} is ${gasUsed.toString()}`,
                    alertId: "FORTA-1",
                    severity: FindingSeverity.High,
                    type: FindingType.Suspicious,
                    metadata: {
                        gasUsed: gasUsed.toString(),
                        distance: gasUsedDistance.toString(),
                    },
                }),
            );
            findingsCount++;
        }

        if (normalLimit < gasPriceDistance && gasPriceDistance <= lowSeverityLimit) {
            findings.push(
                Finding.fromObject({
                    name: "High Gas Price",
                    description: `Gas price in transaction ${txEvent.transaction.hash} is ${gasPrice.toString()}`,
                    alertId: "FORTA-2",
                    severity: FindingSeverity.Low,
                    type: FindingType.Suspicious,
                    metadata: {
                        gasPrice: gasPrice.toString(),
                        distance: gasPriceDistance.toString(),
                    },
                }),
            );
            findingsCount++;
        }
        if (lowSeverityLimit < gasPriceDistance && gasPriceDistance <= midSeverityLimit) {
            findings.push(
                Finding.fromObject({
                    name: "High Gas Price",
                    description: `Gas price in transaction ${txEvent.transaction.hash} is ${gasPrice.toString()}`,
                    alertId: "FORTA-2",
                    severity: FindingSeverity.Medium,
                    type: FindingType.Suspicious,
                    metadata: {
                        gasPrice: gasPrice.toString(),
                        distance: gasPriceDistance.toString(),
                    },
                }),
            );
            findingsCount++;
        }
        if (midSeverityLimit < gasPriceDistance) {
            findings.push(
                Finding.fromObject({
                    name: "High Gas Price",
                    description: `Gas price in transaction ${txEvent.transaction.hash} is ${gasPrice.toString()}`,
                    alertId: "FORTA-2",
                    severity: FindingSeverity.High,
                    type: FindingType.Suspicious,
                    metadata: {
                        gasPrice: gasPrice.toString(),
                        distance: gasPriceDistance.toString(),
                    },
                }),
            );
            findingsCount++;
        }

        gasUsedHistory.enqueue(
            network,
            toAddress,
            signature,
            gasUsed
        );

        gasPriceHistory.enqueue(
            network,
            toAddress,
            signature,
            gasPrice
        );
        return findings;
    };
}

// const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
//   const findings: Finding[] = [];
//   // detect some block condition
//   return findings;
// }

const mockHistory = (networkId: string, toAddress: string, signature: string, gasUsed: bigint, gasPrice: bigint) => {
    gasUsedHistory.enqueue(networkId, toAddress, signature, gasUsed);
    gasPriceHistory.enqueue(networkId, toAddress, signature, gasPrice);
}

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(getTransactionReceipt),
  // handleBlock,
  mockHistory
};
