# Bitcoin SPV in Solidity

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

参考：[Bitcoin Develop: Transaction Data](https://developer.bitcoin.org/devguide/block_chain.html#transaction-data)

