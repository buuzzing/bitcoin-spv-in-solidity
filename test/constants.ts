export const ErrorCode = {
    INVALID_HEADER_SIZE: "Invalid block header size",
    BLOCK_EXISTS: "Block already exists",
    BLOCK_WITH_HEIGHT_NOT_FOUND: "The specified height block does not exist",
    BLOCK_WITH_HASH_NOT_FOUND: "The specified hash block does not exist",
    INVALID_GENESIS: "Genesis height should be greater than 0",
    INVALID_PREV_BLOCK: "Previous block hash not found",
    INSUFFICIENT_POW: "Insufficient proof of work",
}

export const BlockInfo = {
    // #120097 的 raw block header
    // @dev 传递给合约的 bytes like 类型的串需要以 0x 开头
    GENESIS_HEADER: "0x01000000a65157a7d35a487fa2d7019b152a90a8fd150eec19b68deef718000000000000a759626da6ca215507d10c8681328b558dbad808c3861a394357eb91d8db1a3f3a6ab54dacb5001b38f27f41",
    GENESIS_HEIGHT: 120097,
}

