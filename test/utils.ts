import * as crypto from 'crypto';

/**
 * 计算 SHA-256 哈希值
 * @param buffer 输入 bytes
 * @returns 返回 SHA-256 哈希值
 */
function sha256(buffer: Buffer): Buffer {
    return crypto.createHash('sha256').update(buffer).digest();
}

/**
 * 由 raw block header 计算 block hash
 * @param blockHeader 一个以 0x 开头的 80 字节的十六进制字符串
 * @returns 一个以 0x 开头的 64 字节的十六进制字符串（大端序）
 */
export function calculateBlockHash(blockHeader: string): string {
    const blockHeaderBuffer = Buffer.from(blockHeader.slice(2), 'hex');

    if (blockHeaderBuffer.length !== 80) {
        throw new Error('Invalid block header length. Must be 80 bytes.');
    }

    // 两次计算 SHA-256 哈希值
    const firstHash = sha256(blockHeaderBuffer);
    const secondHash = sha256(firstHash);

    // 将小端序转换为大端序
    const blockHash = Buffer.from(secondHash.reverse());

    return "0x" + blockHash.toString('hex');
}