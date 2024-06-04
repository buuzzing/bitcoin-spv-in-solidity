// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

interface ILight {
    /**
     * 成功存储区块头后触发
     * @param headerHash 信任的块头哈希，将被存储在合约中
     * @param height 对应的区块高度
     */
    event storeHeader(bytes32 indexed headerHash, uint32 indexed height);

    /**
     * 链下节点提交区块头
     * @param header 比特币 raw block header，80 bytes
     * @dev 需要按顺序提交区块头，否则无法通过验证将会回滚
     */
    function submitBlockHeader(bytes calldata header) external;

    /**
     * 获取指定高度的区块哈希
     * @param height 区块高度
     * @return 区块哈希，不存在则 revert
     */
    function getBlockHash(uint32 height) external view returns (bytes32);

    /**
     * 获取指定哈希的区块高度
     * @param blockHash 区块哈希
     * @return 区块高度，不存在则 revert
     */
    function getBlockHeight(bytes32 blockHash) external view returns (uint32);

    /**
     * 获取最新区块哈希和高度
     * @return 区块哈希和高度
     */
    function getLatestBlock() external view returns (bytes32, uint32);

    /**
     * 验证交易是否存在于区块中
     * @param height 交易所在区块高度
     * @param index 交易在对应区块交易列表中的位次
     * @param txid 交易哈希
     * @param header 交易所在区块的 raw block header
     * @param proof 默克尔证明
     * @return 是否验证通过
     */
    function verityTx(
        uint32 height,
        uint32 index,
        bytes32 txid,
        bytes calldata header,
        bytes calldata proof
    ) external view returns (bool);
}