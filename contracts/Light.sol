// SPDX-License-Identifier: MIT

import {ILight} from "./ILight.sol";
import "./Error.sol";
import "./Utils.sol";

pragma solidity ^0.8.24;

contract Light is ILight {
    using Utils for bytes;

    // 区块头哈希 => 区块高度
    mapping(bytes32 => uint32) private _headers;
    // 区块高度 => 区块哈希
    mapping(uint32 => bytes32) private _heights;

    /**
     * 在创建合约时指定创世区块头（信任根）
     * @param header 信任根的 raw block header
     * @param height 信任根的区块高度
     */
    constructor(bytes memory header, uint32 height) {
        require(header.length == 80, "Invalid block header size");
        _storeHeader(header.hash(), height);
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
