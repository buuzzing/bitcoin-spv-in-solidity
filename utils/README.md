# 比特币区块

参考：[Bitcoin Develop: Block Chain](https://developer.bitcoin.org/reference/block_chain.html)

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