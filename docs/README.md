# 背景知识

参考：[learn me a bitcoin: Block](https://learnmeabitcoin.com/technical/block/)

## 区块头

比特币区块头被序列化为一个 80 bytes 的串，包含：

| 长度 | 名称 | 描述 |
| :--- | :--- | :--- |
| 4 | version | 版本 |
| 32 | pre_block hash | 前块哈希 |
| 32 | merkle root hash | 默克尔根 |
| 4 | time | 时间戳 |
| 4 | nBits | 难度压缩值 |
| 4 | nonce | 挖矿随机数 |

其中所有数均为**小端序**

举个例子：

```
02000000 ........................... Block version: 2

b6ff0b1b1680a2862a30ca44d346d9e8
910d334beb48ca0c0000000000000000 ... Hash of previous block's header
9d10aa52ee949386ca9385695f04ede2
70dda20810decd12bc9b048aaab31471 ... Merkle root

24d95a54 ........................... [Unix time][unix epoch time]: 1415239972
30c31b18 ........................... Target: 0x1bc330 * 256**(0x18-3)
fe9f0864 ........................... Nonce
```

## 比特币中的交易数据和默克尔树的组织形式

每个区块包含一笔或多笔交易，交易列表的第一笔交易必须为 coinbase 交易

区块可以不包含除了 coinbase 以外的任何交易（即整个区块只有一个 coinbase 交易）

所有的交易（包括 coinbase 交易）都被编码为二进制形式（raw transaction）

编码后的交易计算哈希即得到其 txid，交易列表中 txid 两两组合构成默克尔树

**如果有奇数个 txid，没有配对的 txid 将会和自己组合进行哈希**

不考虑计算哈希的情况下，五笔交易构成的交易列表组成的默克尔树如下：

```
       ABCDEEEE .......Merkle root
      /        \
   ABCD        EEEE
  /    \      /
 AB    CD    EE .......E is paired with itself
/  \  /  \  /
A  B  C  D  E .........Transactions
```

> 需要注意的是，Merkle Root 的计算过程中同样使用小端序
>
> 而在区块链浏览器上查询的交易列表展示的为大端序，因此在计算时需要注意将查询到的 txid 转换为小端序
>
> 具体参见一个计算实例：`utils/cal_merkle_root.py`

参考：[Bitcoin Develop: Transaction Data](https://developer.bitcoin.org/devguide/block_chain.html#transaction-data)

## 验证者如何存储信任根

由线下节点提交一个 80 bytes 长度的 row block header，验证者（链上合约）解析出版本、前块哈希、默克尔根、时间戳、压缩难度值和挖矿随机数（参见[区块头](#区块头)）

验证者对上述数据进行检查：

**版本**

现在比特币有 Version 1, 2, 3 和 4

在本测试中不检查 Version

**前块哈希**

检查前块哈希是否已经被信任，如果前块哈希不被信任，revert

**默克尔根**

验证者由于没有区块体，因此无法检查默克尔根

**时间戳**

必须严格大于前 11 个区块的时间中位数，且不接受超过本地时间 2 小时后的区块

在本测试中不检查 Timestamp

**压缩难度值**

比特币难度值为一个 256 bits 的整数，但在区块头中使用了一个 bytes4 长度的压缩值进行表示

压缩难度值每 2016 个区块更新一次，验证者可以自行计算出 nBits，验证者可以检查给定的压缩难度值和计算结果是否相同

压缩难度值与难度值的转换，难度值的更新策略参见：[Bitcoin Wiki: Difficulty](https://bitcoin.it/wiki/Difficulty)

在本测试中不检查 nBits

**随机数**

矿工通过改变这个数，来改变块头哈希，使得块头哈希可以满足难度值要求

实际上，矿工多通过改变 coinbase 交易的字段，来改变 coinbase 交易的 txid，进而改变 merkle root，从而改变块头哈希

验证者通过计算块头哈希，判断是否小于难度阈值，来检查区块的工作量证明

当上述数据通过验证后，验证者接受这个新的区块头，存储其哈希值，并更新记录的相关信息

## 验证者如何利用默克尔树进行 SPV

### 证明的结构体

对一笔交易，构造它的默克尔证明需要以下内容

``` solidity
bytes32 txid;     // 交易哈希
bytes32 header;   // 交易所在区块的块头
uint32 height;    // 交易所在区块高度
uint32 index;     // 交易在列表中的位次
bytes proof;      // merkle path 上需要的哈希值
```

其中对于 `txid`，证明者也可以仅给出类型为 `bytes` 的 `raw transaction`，由验证者自行计算哈希值得到 `txid`

### 验证者的验证流程

1. 根据 `height` 判断交易所在区块的块头（的哈希值）是否已经被存储；
2. 根据 `height` 查询块头哈希，与给定的 `header` 取哈希进行比较；
3. 令 `txid` 作为 `H` 的初始值；
4. 每次从 `proof` 取出一个 bytes32 的哈希值（从左向右），根据 `index` 值与 `H` 进行左拼接或右拼接，将拼接结果计算哈希（比特币中为 **double sha256**）后重新赋值给 `H`；
5. 重复步骤 4 直至 `proof` 被取空，如果此步骤发生错误（例如 `proof` 不是由整数个 bytes32 构成的），返回 false；
6. 由 `header` 解析出 Merkle Root，记 `root`。判断 `H` 和 `root` 是否相等，相等返回 true，验证通过，否则返回 false