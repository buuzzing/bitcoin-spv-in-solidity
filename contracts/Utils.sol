// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

library Utils {
    /**
     * 从 raw block header 中提取版本号
     * @param header 80 bytes 长的 raw block header
     * @return versionBE 已经转换为大端序的版本号
     */
    function extractVersion(
        bytes memory header
    ) internal pure returns (uint32) {
        uint32 versionBE = 0;
        for (uint8 i = 0; i < 4; i++) {
            versionBE += uint32(uint8(header[i])) << (8 * i);
        }
        return versionBE;
    }

    /**
     * 从 raw block header 中提取前块哈希
     * @param header 80 bytes 长的 raw block header
     * @return prev_hashBE 已经转换为大端序的前块哈希
     */
    function extractPrevBlock(
        bytes memory header
    ) internal pure returns (bytes32 prev_hashBE) {
        bytes memory prev_hashLE = new bytes(32);
        for (uint8 i = 0; i < 32; i++) {
            prev_hashLE[i] = header[i + 4];
        }
        prev_hashBE = convertEndian32(bytes32(prev_hashLE));
    }

    /**
     * 从 raw block header 中提取 merkle root
     * @param header 80 bytes 长的 raw block header
     * @return merkle_rootBE 已经转换为大端序的 merkle root
     */
    function extractMerkleRoot(
        bytes memory header
    ) internal pure returns (bytes32 merkle_rootBE) {
        bytes memory merkle_rootLE = new bytes(32);
        for (uint8 i = 0; i < 32; i++) {
            merkle_rootLE[i] = header[i + 36];
        }
        merkle_rootBE = convertEndian32(bytes32(merkle_rootLE));
    }

    /**
     * 从 raw block header 中提取时间戳
     * @param header 80 bytes 长的 raw block header
     * @return timestampBE 已经转换为大端序的时间戳
     */
    function extractTimestamp(
        bytes memory header
    ) internal pure returns (uint32) {
        uint32 timestampBE = 0;
        for (uint8 i = 0; i < 4; i++) {
            timestampBE += uint32(uint8(header[i + 68])) << (8 * i);
        }
        return timestampBE;
    }

    /**
     * 从 raw block header 中提取压缩的难度目标，并计算出难度目标
     * @param header 80 bytes 长的 raw block header
     * @return targetBE 已经转换为大端序的难度目标
     */
    function extractTarget(
        bytes memory header
    ) internal pure returns (uint256) {
        uint256 targetBE;
        uint32 bits = 0;
        for (uint8 i = 0; i < 4; i++) {
            bits += uint32(uint8(header[i + 72])) << (8 * i);
        }
        targetBE = (bits & 0x00ffffff) * 2 ** (8 * ((bits >> 24) - 3));
        return targetBE;
    }

    /**
     * 从 raw block header 中提取随机数
     * @param header 80 bytes 长的 raw block header
     * @return nonceBE 已经转换为大端序的随机数
     */
    function extractNonce(bytes memory header) internal pure returns (uint32) {
        uint32 nonceBE = 0;
        for (uint8 i = 0; i < 4; i++) {
            nonceBE += uint32(uint8(header[i + 76])) << (8 * i);
        }
        return nonceBE;
    }

    /**
     * 计算哈希，在比特币中是双 SHA256
     * @param data 待计算哈希的数据
     * @return res 计算结果
     */
    function hash(bytes memory data) internal pure returns (bytes32 res) {
        bytes memory tmp_hash = abi.encodePacked(sha256(data));
        res = convertEndian32(sha256(tmp_hash));
    }

    /**
     * @param data 4 bytes 数据的大小端转换
     */
    function convertEndian4(bytes4 data) internal pure returns (bytes4 res) {
        bytes memory t_res = new bytes(4);
        for (uint8 i = 0; i < 4; i++) {
            t_res[i] = data[4 - i - 1];
        }
        res = bytes4(t_res);
    }

    /**
     * @param data 32 bytes 数据的大小端转换
     */
    function convertEndian32(bytes32 data) internal pure returns (bytes32 res) {
        bytes memory t_res = new bytes(32);
        for (uint8 i = 0; i < 32; i++) {
            t_res[i] = data[32 - i - 1];
        }
        res = bytes32(t_res);
    }

    /**
     * @param data 32 bytes 数据转换为 uint256
     */
    function bytes32ToUint256(bytes32 data) external pure returns (uint256) {
        uint256 res = 0;
        for (uint8 i = 0; i < 32; i++) {
            res = (res << 8) | uint8(data[i]);
        }
        return res;
    }

    /**
     * 从 proof 数据中提取一个 32 bytes 的证明，从 offset 位开始
     * @param data proof 数据
     * @param offset 偏移位
     */
    function extractProof(
        bytes memory data,
        uint32 offset
    ) internal pure returns (bytes32 _hash) {
        bytes memory t_hash = new bytes(32);
        for (uint8 i = 0; i < 32; i++) {
            t_hash[i] = data[i + offset];
        }
        _hash = bytes32(t_hash);
    }

    /**
     * 拼接两个 bytes32 的数据（两个哈希，用于 merkle tree 的计算）
     * @param left 左哈希
     * @param right 右哈希
     */
    function connectHash(
        bytes32 left,
        bytes32 right
    ) external pure returns (bytes memory) {
        bytes memory res = new bytes(64);
        for (uint8 i = 0; i < 32; i++) {
            res[i] = left[i];
            res[i + 32] = right[i];
        }
        return res;
    }
}
