# Cosmos Block By Date

Get Cosmos block number by a given date, using [CosmWasmClient](https://cosmos.github.io/cosmjs/latest/cosmwasm-stargate/classes/CosmWasmClient.html).

This library is a fork of [eth-block-for-date](https://github.com/m1guelpf/eth-block-for-date) adapted for the Cosmos blockchain.

## Installation

### Deno, npm, Yarn, pnpm, Bun from [JSR](https://jsr.io/@nktkas/cosmos-block-for-date)

```
deno add @nktkas/cosmos-block-for-date
```

```
npx jsr add @nktkas/cosmos-block-for-date
```

```
yarn dlx jsr add @nktkas/cosmos-block-for-date
```

```
pnpm dlx jsr add @nktkas/cosmos-block-for-date
```

```
bunx jsr add @nktkas/cosmos-block-for-date
```

## Usage

```typescript
import { CosmosDater } from "@nktkas/cosmos-block-for-date";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const client = await CosmWasmClient.connect("YOUR_RPC_URL");
const dater = new CosmosDater(client);

let block = await dater.getBlock(
    new Date("2023-07-20T13:20:40Z"), // Date, required.
    true, // Block after, optional. Search for the nearest block before or after the given date. True by default.
    false, // Refresh boundaries, optional. Recheck the latest block before request. False by default
);
```

If the given date is in the future, the script will return the latest block.

## License

This project is licensed under the MIT License. Check the [License file](LICENSE) for more info.
