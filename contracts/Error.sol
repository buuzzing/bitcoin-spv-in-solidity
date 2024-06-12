// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

library Error {
    string constant INVALID_HEADER_SIZE = "Invalid block header size";
    string constant BLOCK_EXISTS = "Block already exists";
    string constant PREV_BLOCK_NOT_FOUND = "Previous block not found";
    string constant BLOCK_WITH_HEIGHT_NOT_FOUND =
        "The specified height block does not exist";
    string constant BLOCK_WITH_HASH_NOT_FOUND =
        "The specified hash block does not exist";
    string constant INVALID_GENESIS = "Genesis height should be greater than 0";
    string constant INVALID_PREV_BLOCK = "Previous block hash not found";
    string constant INSUFFICIENT_POW = "Insufficient proof of work";
}
