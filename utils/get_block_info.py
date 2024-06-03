import json
import os
import requests

URL = "https://blockchain.info/rawblock/"


# 根据区块高度获取区块信息
def get_block_info(block_number: int) -> dict:
    response = requests.get(URL + str(block_number)).json()
    txs = []
    for tx in response["tx"]:
        txs.append(tx["hash"])

    return {
        # 区块头信息
        "ver": response["ver"],
        "prev_block": response["prev_block"],
        "mrkl_root": response["mrkl_root"],
        "time": response["time"],
        "bits": response["bits"],
        "nonce": response["nonce"],
        # 仅包含交易哈希的交易列表
        "tx": txs,
        # 区块哈希
        "hash": response["hash"],
    }


# 记录区块信息至文件，供后续使用
# 测试中使用了高度 120097 到 120103 的区块
def record_block_info():
    block_info = {}
    for block_number in range(120097, 120104):
        info = get_block_info(block_number)
        block_info[block_number] = info
    
    with open("block_info.json", "w") as f:
        json.dump(block_info, f, indent=4)

if __name__ == "__main__":
    if os.path.exists("block_info.json"):
        print("block_info.json 已经存在")
    else:
        record_block_info()
        print("block_info.json 成功创建")
