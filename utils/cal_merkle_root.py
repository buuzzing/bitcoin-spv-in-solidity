from binascii import unhexlify
from hashlib import sha256
import json
import os


def convert_endian(data: str) -> str:
    return "".join(reversed([data[i : i + 2] for i in range(0, len(data), 2)]))


def cal_hash(data: str) -> bytes:
    header = unhexlify(data)
    return sha256(sha256(header).digest())


# 递归计算 Merkle Root
# txs 是从区块链浏览器上获取的交易列表，为大端序
# 在比特币中的所有计算均为小端序
def cal_merkle_root(txs: list) -> str:
    if len(txs) == 1:
        return txs[0]

    if len(txs) % 2 != 0:
        txs.append(txs[-1])

    new_txs = []
    for i in range(0, len(txs), 2):
        # 将大端序转换为小端序，再计算哈希
        tx_l = convert_endian(txs[i])
        tx_r = convert_endian(txs[i + 1])
        tx_lr_hash = cal_hash(tx_l + tx_r).hexdigest()

        # 将计算出的哈希转换为大端序，再添加到新的交易列表中
        new_txs.append(convert_endian(tx_lr_hash))

    return cal_merkle_root(new_txs)


# 读取从区块链浏览器上获得的 block_info.json
# 由 tx list 计算 Merkle Root，并与浏览器上的 Merkle Root 进行比较
if __name__ == "__main__":
    if not os.path.exists("block_info.json"):
        print("找不到 block_info.json")
        exit()

    with open("block_info.json", "r") as f:
        block_info = json.load(f)

    # 遍历区块 120097 到 120103
    for block_num in block_info:
        merkle_root = block_info[block_num]["mrkl_root"]
        txs = block_info[block_num]["tx"]

        calculated_merkle_root = cal_merkle_root(txs)
        print(f"Block number: #{block_num}")

        for tx_num in range(len(txs)):
            print(f"Tx #{tx_num:<{2}}: \033[32m{txs[tx_num]}\033[0m")

        print(f"Merkle root shoule be:  {merkle_root}")
        print(f"Calculated Merkle root: {calculated_merkle_root}", end="\n\n")

        assert merkle_root == calculated_merkle_root, "Merkle root 不匹配"
