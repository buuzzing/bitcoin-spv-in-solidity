// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {ILight} from "./ILight.sol";
import {Validate} from "./Validate.sol";
import {Error} from "./Error.sol";
import {Utils} from "./Utils.sol";

contract Light is ILight {
    using Utils for bytes;

    // 区块高度需要大于 0
    // 区块哈希 => 区块高度
    mapping(bytes32 => uint32) private _headers;
    // 区块高度 => 区块哈希
    mapping(uint32 => bytes32) private _heights;

    // 最新区块高度
    uint32 latestHeight;
    // 最新区块哈希
    bytes32 latestHash;

    /**
     * 在创建合约时指定创世区块头（信任根）
     * @param header 信任根的 raw block header
     * @param height 信任根的区块高度
     */
    constructor(bytes memory header, uint32 height) {
        require(header.length == 80, Error.INVALID_HEADER_SIZE);
        require(height > 0, Error.INVALID_GENESIS);

        // 存储创世区块头
        _storeHeader(header.hash(), height);
        // 更新最新区块高度和哈希
        latestHeight = height;
        latestHash = header.hash();
    }

    function submitBlockHeader(bytes memory header) external override {
        // raw block header 长度必须为 80 字节
        require(header.length == 80, Error.INVALID_HEADER_SIZE);

        // 如果区块存在，返回失败
        bytes32 blockHash = header.hash();
        require(_headers[blockHash] == 0, Error.BLOCK_EXISTS);

        // 如果前序区块不存在，返回失败
        bytes32 prevBlockHash = header.extractPrevBlock();
        require(_headers[prevBlockHash] > 0, Error.BLOCK_EXISTS);

        // 对区块头做工作量证明验证
        uint256 target = header.extractTarget();
        require(
            Utils.bytes32ToUint256(blockHash) <= target,
            Error.INSUFFICIENT_POW
        );

        // 验证通过，存储区块头
        uint32 height = _headers[prevBlockHash] + 1;
        _storeHeader(blockHash, height);

        // 判断是否需要更新最新区块高度和哈希
        if (height > latestHeight) {
            latestHeight = height;
            latestHash = blockHash;
        }
    }

    /**
     * @dev 参见 ILight.getBlockHash
     */
    function getBlockHash(
        uint32 height
    ) external view override returns (bytes32) {
        require(
            _heights[height] != bytes32(0),
            Error.BLOCK_WITH_HEIGHT_NOT_FOUND
        );
        return _heights[height];
    }

    /**
     * @dev 参见 ILight.getBlockHeight
     */
    function getBlockHeight(
        bytes32 blockHash
    ) external view override returns (uint32) {
        require(_headers[blockHash] > 0, Error.BLOCK_WITH_HASH_NOT_FOUND);
        return _headers[blockHash];
    }

    /**
     * @dev 参见 ILight.getLatestBlock
     */
    function getLatestBlock() external view override returns (bytes32, uint32) {
        return (latestHash, latestHeight);
    }

    /**
     * @dev 参见 ILight.verifyTx
     */
    function verityTx(
        uint32 height,
        uint32 index,
        bytes32 txid,
        bytes calldata header,
        bytes calldata proof
    ) external view override returns (bool) {
        // 信任根需要存在
        require(
            _heights[height] != bytes32(0),
            Error.BLOCK_WITH_HEIGHT_NOT_FOUND
        );
        // 给定区块头需要正确
        require(
            header.hash() == _heights[height],
            Error.BLOCK_WITH_HASH_NOT_FOUND
        );

        return Validate.prove(txid, header.extractMerkleRoot(), proof, index);
    }

    /**
     * 存储区块头哈希
     * @param headerHash 区块头哈希
     * @param height 区块头对应的高度
     */
    function _storeHeader(bytes32 headerHash, uint32 height) private {
        _headers[headerHash] = height;
        _heights[height] = headerHash;
        emit storeHeader(headerHash, height);
    }
}
