export const ErrorCode = {
    INVALID_HEADER_SIZE: "Invalid block header size",
    BLOCK_EXISTS: "Block already exists",
    PREV_BLOCK_NOT_FOUND: "Previous block not found",
    BLOCK_WITH_HEIGHT_NOT_FOUND: "The specified height block does not exist",
    BLOCK_WITH_HASH_NOT_FOUND: "The specified hash block does not exist",
    INVALID_GENESIS: "Genesis height should be greater than 0",
    INVALID_PREV_BLOCK: "Previous block hash not found",
    INSUFFICIENT_POW: "Insufficient proof of work",
}

export const BlockInfo = {
    // #120097 的 raw block header
    GENESIS_HEIGHT: 120097,
}

