# Bitcoin SPV in Solidity

## 环境

```
Node.js >= 16.0
```

## 启动

环境搭建

``` bash
npm install
```

运行测试（会自动编译合约）

``` bash
npx hardhat test
```

编译合约

``` bash
npx hardhat compile
```

## 链数据

本测试中使用了比特币高度 120097 到 120103 的区块，以 120097 块作为创世纪块

使用 `utils/get_block_info.py` 从 [Blockchain Info](https://blockchain.info/) 上获取区块信息，写入文件 `block_info.json`

使用 `utils/get_raw_header.py` 从 [Blockchain Info](https://blockchain.info/) 上获取 raw block header，写入文件 `raw_headers.json`

`utils/cal_block_hash.py` 和 `utils/cal_merkle_root.py` 用实现了由 raw block header 计算 block hash 和 由 txid 列表计算 merkle root