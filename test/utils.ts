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

/**
 * 计算哈希
 * @param data 由十六进制串转换得到的 Buffer
 * @returns data 的 SHA-256 哈希值
 */
function calculateHash(data: Buffer): Buffer {
    const firstHash = sha256(data);
    const secondHash = sha256(firstHash);

    return secondHash;
}

/**
 * Merkle Tree 向上计算一层的哈希值
 * @param txids 当前层的哈希值
 * @returns 上一层的哈希值
 */
function calculateUpper(txids: string[]): string[] {
    if (txids.length === 1) {
        return txids;
    }

    // 如果当前层的哈希值个数为奇数，复制最后一个哈希值
    if (txids.length % 2 === 1) {
        txids.push(txids[txids.length - 1]);
    }

    let upper_hash: string[] = [];
    for (let i = 0; i < txids.length; i += 2) {
        // 将大端序转换为小端序，再计算哈希
        const tx_l = Buffer.from(txids[i], 'hex').reverse();
        const tx_r = Buffer.from(txids[i + 1], 'hex').reverse();
        const data = Buffer.concat([tx_l, tx_r]);
        const hash = calculateHash(data);

        // 将计算出的哈希转换为大端序，再添加到新的数组中
        upper_hash.push(Buffer.from(hash).reverse().toString('hex'));
    }

    return upper_hash;
}

/**
 * 本测试中取 #120099 块的 #5 交易，并为其生成一个 Merkle proof
 * 交易哈希为 e0a52b5f17e5e256076d4050290a1f36268ab4a629a10f563dc4d32b3f03f236
 * #120099 块中一共有 10 个交易，因此构建的 Merkle Tree 为
 *                  ABCDEFGHIJIJIJIJ
 *                  /            \
 *           ABCDEFGH            IJIJIJIJ .... 同理
 *          /       \              /
 *      ABCD        EFGH        IJIJ ......... IJ 与自己拼接
 *     /    \      /    \      /
 *    AB    CD    EF    GH    IJ
 *   /  \  /  \  /  \  /  \  /  \
 *   A  B  C  D  E  F  G  H  I  J ............ txid
 *   |  |  |  |  |  |  |  |  |  |
 *   0  1  2  3  4  5  6  7  8  9 ............ raw transaction
 * 需要验证的交易为 F，其 Merkle proof 为 [E, GH, ABCD, IJIJIJIJ]
 * @returns 一个包含交易哈希和 Merkle proof 的串
 */
export function makeTxWithProof(): [string, string] {
    let txHash: string;
    let proof: string[] = [];

    // 从 block_info.json 文件中获取 #120099 块的 txid 列表
    const data = fs.readFileSync('block_info.json', 'utf8');
    const blockInfo = JSON.parse(data);
    let txLists = blockInfo["120099"].tx;
    let txIndex = 5;

    txHash = txLists[txIndex];

    while (txLists.length > 1) {
        // 这里的 txIndex 为在当前层的索引
        if (txIndex % 2 === 1) {
            // 如果为奇数，即在一对节点中的右边那个，proof 中需要左侧那个
            proof.push(txLists[txIndex - 1]);
        } else {
            // 否则即在一对节点中的左边那个，proof 中需要右侧那个
            proof.push(txLists[txIndex + 1]);
        }

        // 计算上一层的哈希值，并更新 txIndex
        txIndex = Math.floor(txIndex / 2);
        txLists = calculateUpper(txLists);
    }

    return [txHash, proof.join('')];
}

export * as utils from "./utils";