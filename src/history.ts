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
    private globalMean: bigint = BigInt(0);
    private globalVariance: bigint = BigInt(0);
    private globalCount: number = 0;
    private storage: {
        [networkId: string]: {
            [address: string]: {
                [signature: string]: {
                    mean: bigint,
                    variance: bigint
                    count: number
                }
            }
        };
    } = {};

    constructor(
        private alpha: number = Infinity,
    ) { }

    getGlobalDistance(value: bigint) : bigint {
        if (this.globalCount < 1 / this.alpha) {
            return BigInt(0);
        }
        if (value > this.globalMean) {
            return (value - this.globalMean) / sqrt(this.globalVariance);
        } else {
            return (this.globalMean - value) / sqrt(this.globalVariance);
        }
    }

    getDistance(
        networkId: string,
        address: string,
        signature: string,
        value: bigint
    ): bigint {
        const entry = this.storage[networkId]?.[address]?.[signature];
        // if the entry does not exist or the data is not enough, just return 0 as we are not sure
        if (!entry || entry.count < 1 / this.alpha) {
            return BigInt(0);
        }
        const mean = entry.mean;
        const variance = entry.variance;

        // if the variance is 0
        if (!variance) {
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

    globalEnqueue(value: bigint) {
        this.globalCount += 1;
        if (this.globalMean == BigInt(0)) {
            this.globalMean = value;
            this.globalVariance = BigInt(0);
        } else {
            const sigma = value - this.globalMean;
            this.globalMean = this.globalMean + sigma * BigInt(this.alpha * 1e6) / BigInt(1e6);
            this.globalVariance = (this.globalVariance + sigma * sigma * BigInt(this.alpha * 1e6) / BigInt(1e6)) * BigInt((1 - this.alpha) * 1e6) / BigInt(1e6);
        }
    }

    enqueue(
        networkId: string,
        address: string,
        signature: string,
        value: bigint
    ) {
        this.globalEnqueue(value);
        if (!this.storage[networkId]) {
            this.storage[networkId] = {};
        }

        if (!this.storage[networkId][address]) {
            this.storage[networkId][address] = {};
        }

        if (this.storage[networkId][address][signature]) {
            const {mean, variance, count} = this.storage[networkId][address][signature];
            // this is calculations of the moving average and the moving variance
            const sigma = value - mean;
            const next_mean = mean + sigma * BigInt(this.alpha * 1e6) / BigInt(1e6);
            const next_variance = (variance + sigma * sigma * BigInt(this.alpha * 1e6) / BigInt(1e6)) * BigInt((1 - this.alpha) * 1e6) / BigInt(1e6);
            this.storage[networkId][address][signature] = {
                mean: next_mean,
                variance: next_variance,
                count: count + 1
            };
        } else {
            this.storage[networkId][address][signature] = {
                mean: value,
                variance: BigInt(0),
                count: 1
            };
        }
    }
}

export default GasHistory