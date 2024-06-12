import * as crypto from 'crypto';
import * as fs from 'fs';

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
 * @param blockHeader 一个 80 字节的十六进制字符串
 * @returns 一个 64 字节的十六进制字符串（大端序）
 */
export function calculateBlockHash(blockHeader: string): string {
    const blockHeaderBuffer = Buffer.from(blockHeader, 'hex');

    if (blockHeaderBuffer.length !== 80) {
        throw new Error('Invalid block header length. Must be 80 bytes.');
    }

    // 两次计算 SHA-256 哈希值
    const firstHash = sha256(blockHeaderBuffer);
    const secondHash = sha256(firstHash);

    // 将小端序转换为大端序
    const blockHash = Buffer.from(secondHash.reverse());

    return blockHash.toString('hex');
}

/**
 * 从 raw_headers.json 文件中获取指定高度的 raw block header
 * raw_headers.json 文件由 utils/get_raw_headers.py 生成
 * @param height 区块高度。本测试中，必须在 120097 到 120103 之间
 * @returns 对应高度的 raw block header，一个 80 字节的十六进制字符串
 */
export function getRawHeaderFromHeight(height: number): string {
    if (height < 120097 || height > 120103) {
        throw new Error('Invalid block height. Must be between 120097 and 120103.');
    }

    const data = fs.readFileSync('raw_headers.json', 'utf8');
    const rawHeaders = JSON.parse(data);

    return rawHeaders[height];
}

/**
 * 修改 block header 的 nonce 为 0
 * @param blockHeader raw block header
 * @returns 将 header 的 nonce 修改为 0 后的 header
 */
export function changeHeaderNonce(blockHeader: string): string {
    // 检查 header 长度是否为 80 字节（160 个字符）
    if (blockHeader.length !== 160) {
        throw new Error('Invalid block header length. Must be 80 bytes.');
    }

    // 将 header 转换为二进制数组
    let bytesArray = ((header: string): Uint8Array => {
        let bytesArray = new Uint8Array(header.length / 2);
        for (let i = 0; i < header.length; i += 2) {
            bytesArray[i / 2] = parseInt(header.slice(i, i + 2), 16);
        }
        return bytesArray;
    })(blockHeader);

    // 修改数组的最后四个字节（nonce）为 0
    for (let i = 76; i < 80; i++) {
        bytesArray[i] = 0;
    }

    // 将修改后的二进制数组转换为十六进制字符串
    let newHeader = ((bytesArray: Uint8Array): string => {
        return Array.from(bytesArray, byte => byte.toString(16).padStart(2, '0')).join('');
    })(bytesArray);

    return newHeader;
}

export * as utils from "./utils"