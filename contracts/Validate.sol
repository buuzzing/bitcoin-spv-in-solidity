// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Utils} from "./Utils.sol";

library Validate {
    using Utils for bytes;
    using Utils for bytes32;

    function prove(
        bytes32 txid,
        bytes32 root,
        bytes memory proof,
        uint32 index
    ) external pure returns (bool) {
        uint32 offset = 0;
        bytes32 t_root = txid;
        bytes32 pair;

        while (offset < proof.length) {
            // 取出 32 bytes 的一个哈希值
            pair = proof.extractProof(offset);
            offset += 32;

            // 将大端序转换为小端序，再计算哈希
            t_root = t_root.convertEndian32();
            pair = pair.convertEndian32();

            // 根据为此决定是左拼接还是右拼接
            // coinbase 作为 0 号交易
            // 计算得到的新 t_root 已经转换为大端序
            if (index % 2 == 1) {
                t_root = Utils.connectHash(pair, t_root).hash();
            } else {
                t_root = Utils.connectHash(t_root, pair).hash();
            }

            // 计算完成，沿 merkle path 向上一层
            index = index / 2;
        }

        return root == t_root;
    }
}
