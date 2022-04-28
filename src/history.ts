function sqrt(value: bigint) {
    if (value < BigInt(0)) {
        throw 'square root of negative numbers is not supported'
    }

    if (value < BigInt(2)) {
        return value;
    }

    function newtonIteration(n: bigint, x0: bigint): bigint {
        const x1 = ((n / x0) + x0) >> BigInt(1);
        if (x0 === x1 || x0 === (x1 - BigInt(1))) {
            return x0;
        }
        return newtonIteration(n, x1);
    }

    return newtonIteration(value, BigInt(1));
}

class GasHistory {
    private storage: {
        [networkId: string]: {
            [address: string]: {
                [signature: string]: {
                    mean: bigint,
                    variance: bigint
                }
            }
        };
    } = {};

    constructor(
        private alpha: number = Infinity,
    ) { }

    getDistance(
        networkId: string,
        address: string,
        signature: string,
        value: bigint
    ): bigint {
        const entry = this.storage[networkId]?.[address]?.[signature];
        if (!entry) {
            return BigInt(0);
        }
        const mean = entry.mean;
        const variance = entry.variance;
        if (!mean && !variance) {
            return BigInt(0)
        }
        if (mean && !variance) {
            if (mean == value) {
                return BigInt(0)
            }
            return BigInt(1e12);
        }
        if (value > mean) {
            return (value - mean) / sqrt(variance);
        } else {
            return (mean - value) / sqrt(variance);
        }
    }

    enqueue(
        networkId: string,
        address: string,
        signature: string,
        value: bigint
    ) {
        if (!this.storage[networkId]) {
            this.storage[networkId] = {};
        }

        if (!this.storage[networkId][address]) {
            this.storage[networkId][address] = {};
        }

        if (this.storage[networkId][address][signature]) {
            const {mean, variance} = this.storage[networkId][address][signature];
            const sigma = value - mean;
            const next_mean = mean + sigma * BigInt(this.alpha * 1e6) / BigInt(1e6);
            const next_variance = (variance + sigma * sigma * BigInt(this.alpha * 1e6) / BigInt(1e6)) * BigInt((1 - this.alpha) * 1e6) / BigInt(1e6);
            this.storage[networkId][address][signature] = {
                mean: next_mean,
                variance: next_variance
            };
        } else {
            this.storage[networkId][address][signature] = {
                mean: value,
                variance: BigInt(0)
            };
        }
    }
}

export default GasHistory