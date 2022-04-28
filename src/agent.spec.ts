import {
    createTransactionEvent,
    ethers,
    Finding,
    FindingSeverity,
    FindingType, getTransactionReceipt,
    HandleTransaction,
    Network,
} from "forta-agent";
import agent from "./agent";

describe("dynamic high gas detection agent", () => {
  let handleTransaction: HandleTransaction;
  const mockGetTransactionReceipt = jest.fn()
  const mockTxEvent = createTransactionEvent({
      block: {
          hash: '0xb95e8e0c5004f8bfe2412419cf11ebd11c8f067fbbe933293b689624380f173e',
          number: 13682565,
          timestamp: 1637830998
      },
      contractAddress: null,
      logs: [],
      network: Network.MAINNET,
      transaction: {
          hash: '0x338c6d7095228544f27ba8479aea6cadbe5aea98806a651f66ef30b3cd7e1813',
          from: '0x39f6a6c85d39d5abad8a398310c52e7c374f2ba3',
          to: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          nonce: 360920,
          gas: '0x29810',
          gasPrice: '0x1c2c297a00',
          value: '0x0',
          data: '0xa9059cbb000000000000000000000000438f2c0d72ceeb037525a074ba91293d31a5714d0000000000000000000000000000000000000000000000000000000017476b6e',
          r: '0xf2afe32cb7cb86b2187b752398d0d1cf58de5c06f6c6d2756bc2d3ba91290c09',
          s: '0x5705f235e921de04f5a074d31a92a4ea3bf1cbf9745d8bf142eebf8787d4d6fa',
          v: '0x26',
      }
  });

    const mockHighGasPriceTxEvent = createTransactionEvent({
        block: {
            hash: '0xb95e8e0c5004f8bfe2412419cf11ebd11c8f067fbbe933293b689624380f173e',
            number: 13682565,
            timestamp: 1637830998
        },
        contractAddress: null,
        logs: [],
        network: Network.MAINNET,
        transaction: {
            hash: '0x338c6d7095228544f27ba8479aea6cadbe5aea98806a651f66ef30b3cd7e1813',
            from: '0x39f6a6c85d39d5abad8a398310c52e7c374f2ba3',
            to: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            nonce: 360920,
            gas: '0x29810',
            gasPrice: '0xf1c2c297a0',
            value: '0x0',
            data: '0xa9059cbb000000000000000000000000438f2c0d72ceeb037525a074ba91293d31a5714d0000000000000000000000000000000000000000000000000000000017476b6e',
            r: '0xf2afe32cb7cb86b2187b752398d0d1cf58de5c06f6c6d2756bc2d3ba91290c09',
            s: '0x5705f235e921de04f5a074d31a92a4ea3bf1cbf9745d8bf142eebf8787d4d6fa',
            v: '0x26',
        }
    });

  beforeAll(() => {
    handleTransaction = agent.provideHandleTransaction(mockGetTransactionReceipt);
    for (let i = 0; i < 100; i++) {
        if (!mockTxEvent.transaction.to) {
            continue;
        }
        const network = mockTxEvent.network.toString();
        const toAddress = mockTxEvent.transaction.to?.toString();
        const signature = "0xa9059cbb";
        const gasUsed = BigInt("0xb41d");
        const gasPrice = BigInt("0x1c2c297a00");
        agent.mockHistory(network, toAddress, signature, gasUsed, gasPrice);
    }
  });

  describe("handleTransaction", () => {
    it("returns empty findings if there are no unusual gas", async () => {
      mockGetTransactionReceipt.mockReturnValueOnce({ gasUsed: "0xb41d" })
      const findings = await handleTransaction(mockTxEvent);
      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if there are txns with high gas used", async () => {
        const gasUsed = "0xffb41d"
        mockGetTransactionReceipt.mockReturnValueOnce({ gasUsed: gasUsed })
        const findings = await handleTransaction(mockTxEvent);
        expect(findings).toStrictEqual([
            Finding.fromObject({
                name: "High Gas Used",
                description: `Gas used in transaction ${mockTxEvent.transaction.hash} is ${BigInt(gasUsed).toString()}`,
                alertId: "FORTA-1",
                severity: FindingSeverity.High,
                type: FindingType.Suspicious,
                metadata: {
                    gasUsed: BigInt(gasUsed).toString(),
                    distance: "1000000000000",
                },
            })
        ]);
    });

    it("returns empty findings if there are txns with high gas used", async () => {
        const gasUsed = "0xb41d"
        const gasPrice = BigInt(mockHighGasPriceTxEvent.transaction.gasPrice).toString()
        mockGetTransactionReceipt.mockReturnValueOnce({ gasUsed: gasUsed })
        const findings = await handleTransaction(mockHighGasPriceTxEvent);
        expect(findings).toStrictEqual([
            Finding.fromObject({
                name: "High Gas Price",
                description: `Gas price in transaction ${mockHighGasPriceTxEvent.transaction.hash} is ${gasPrice}`,
                alertId: "FORTA-2",
                severity: FindingSeverity.High,
                type: FindingType.Suspicious,
                metadata: {
                    gasPrice: gasPrice,
                    distance: "1000000000000",
                },
            })
        ]);
    });
  });
});
