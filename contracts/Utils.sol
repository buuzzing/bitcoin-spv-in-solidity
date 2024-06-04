// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

library Utils {
    function littleEndian32(bytes32 data) internal pure returns (bytes32 res) { 
        bytes memory t_res = new bytes(32);
        for (uint8 i = 0; i < 32; i++) {
            t_res[i] = data[32 - i - 1];
        }
        res = bytes32(t_res);
    }

    function hash(bytes memory data) internal pure returns (bytes32 res) {
        bytes memory tmp_hash = abi.encodePacked(sha256(data));
        res = littleEndian32(sha256(tmp_hash));
    }
}