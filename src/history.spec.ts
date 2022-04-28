import GasHistory from "./history";
import {parse} from "ts-jest";
const {
    FindingType,
    FindingSeverity,
    Finding,
    createTransactionEvent,
} = require("forta-agent");

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}

describe("GasHistory", () => {
    const history = new GasHistory(0.05);
    describe("detect unusual values", () => {
        it("distances should be normal for normal values", async () => {
            const networkId = "1", toAddress = "0x9b9647431632af44be02ddd22477ed94d14aacaa", signature = "0x0";
            for (let i = 0; i <= 100; i++) {
                history.enqueue(networkId, toAddress, signature, BigInt(getRandomInt(100)))
            }
            const distance = history.getDistance(networkId, toAddress, signature, BigInt(getRandomInt(100)));
            expect(parseInt(distance.toString())).toBeLessThan(5);
        });

        it("distances should be high for unnormal values", async () => {
            const networkId = "1", toAddress = "0x9b9647431632af44be02ddd22477ed94d14aacaa", signature = "0x0";
            for (let i = 0; i <= 100; i++) {
                history.enqueue(networkId, toAddress, signature, BigInt(getRandomInt(100)))
            }
            const distance = history.getDistance(networkId, toAddress, signature, BigInt(1000));
            expect(parseInt(distance.toString())).toBeGreaterThan(5);
        });
    });
});