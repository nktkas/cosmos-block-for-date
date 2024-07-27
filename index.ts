import type { CosmWasmClient } from "npm:@cosmjs/cosmwasm-stargate@^0.32.4";

export type Block = {
    height: number;
    date: Date;
};

/**
 * Class to find the nearest block to a specified date
 */
export class CosmosDater {
    public requests = 0;
    private readonly client: CosmWasmClient;
    private firstBlock: Block | undefined;
    private latestBlock: Block | undefined;
    private blockTime: number | undefined;
    private readonly savedBlocks: Record<number, Block> = {};
    private readonly checkedBlocks: Record<number, number[]> = {};

    constructor(client: CosmWasmClient) {
        this.client = client;
    }

    async #getBoundaries(): Promise<void> {
        this.firstBlock = await this.#getBlock(1);
        this.latestBlock = await this.#getBlock();

        this.blockTime = (this.latestBlock.date.getTime() - this.firstBlock.date.getTime()) / (this.latestBlock.height - 1);
    }

    /**
     * Get the block closest to the given date
     * @param date The target date for which to find the nearest block
     * @param after Block after, optional. Search for the nearest block before or after the given date. True by default
     * @param refresh Refresh boundaries, optional. Recheck the latest block before request. False by default
     * @returns A Promise resolving to a Block object with height and date of the closest block to the given date
     */
    public async getBlock(date: Date, after = true, refresh = false): Promise<Block> {
        if (refresh || this.firstBlock == undefined || this.latestBlock == undefined || this.blockTime == undefined) {
            await this.#getBoundaries();
        }

        if (isBefore(date, this.firstBlock!.date)) {
            return this.firstBlock!;
        }

        if (isSameOrAfter(date, this.latestBlock!.date)) {
            return this.latestBlock!;
        }

        this.checkedBlocks[date.getTime()] = [];

        return await this.#findBetter(
            date,
            await this.#getBlock(Math.ceil((date.getTime() - this.firstBlock!.date.getTime()) / this.blockTime!)),
            after,
            this.blockTime!,
        );
    }

    async #findBetter(date: Date, predictedBlock: Block, after: boolean, blockTime: number): Promise<Block> {
        if (await this.#isBetterBlock(date, predictedBlock, after)) return predictedBlock;

        const difference = date.getTime() - predictedBlock.date.getTime();
        let skip = Math.ceil(difference / (blockTime == 0 ? 1 : blockTime));
        if (skip == 0) skip = difference < 0 ? -1 : 1;

        const nextPredictedBlock = await this.#getBlock(this.#getNextBlock(date, predictedBlock.height, skip));
        blockTime = Math.abs(
            (predictedBlock.date.getTime() - nextPredictedBlock.date.getTime()) /
                (predictedBlock.height - nextPredictedBlock.height),
        );

        return this.#findBetter(date, nextPredictedBlock, after, blockTime);
    }

    async #isBetterBlock(date: Date, predictedBlock: Block, after: boolean): Promise<boolean> {
        const blockTime = predictedBlock.date;

        if (after) {
            if (isBefore(blockTime, date)) return false;
            const previousBlock = await this.#getBlock(predictedBlock.height - 1);
            if (isSameOrAfter(blockTime, date) && previousBlock.date < date) return true;
        } else {
            if (isSameOrAfter(blockTime, date)) return false;
            const nextBlock = await this.#getBlock(predictedBlock.height + 1);
            if (isBefore(blockTime, date) && isSameOrAfter(nextBlock.date, date)) return true;
        }

        return false;
    }

    #getNextBlock(date: Date, currentBlock: number, skip: number): number {
        let nextBlock = currentBlock + skip;
        if (nextBlock > this.latestBlock!.height) nextBlock = this.latestBlock!.height;

        if (this.checkedBlocks[date.getTime()].includes(nextBlock)) {
            return this.#getNextBlock(date, currentBlock, skip < 0 ? --skip : ++skip);
        }

        this.checkedBlocks[date.getTime()].push(nextBlock);

        return nextBlock < 1 ? 1 : nextBlock;
    }

    async #getBlock(height?: number): Promise<Block> {
        if (height !== undefined && this.savedBlocks[height]) return this.savedBlocks[height];

        const block = await this.client.getBlock(height);
        this.savedBlocks[block.header.height] = { date: new Date(block.header.time), height: block.header.height };

        this.requests++;
        return this.savedBlocks[block.header.height];
    }
}

const isSameOrAfter = (date: Date, dateToCompare: Date) => date.getTime() >= dateToCompare.getTime();
const isBefore = (date: Date, dateToCompare: Date) => date.getTime() < dateToCompare.getTime();
