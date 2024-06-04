import json
import os
import requests

URL = "https://blockchain.info/rawblock/"

# 根据区块高度获取区块头信息
def get_raw_header(block_number: int) -> str:
    response = requests.get(URL + str(block_number) + "?format=hex")
    return response.text[:160]

# 记录区块头信息至文件，供后续使用
# 测试中使用了高度 120097 到 120103 的区块
def record_raw_header():
    raw_headers = {}
    for block_number in range(120097, 120104):
        header = get_raw_header(block_number)
        raw_headers[block_number] = header
    
    with open("raw_headers.json", "w") as f:
        json.dump(raw_headers, f, indent=4)

if __name__ == "__main__":
    if os.path.exists("raw_headers.json"):
        print("raw_headers.json 已经存在")
    else:
        record_raw_header()
        print("raw_headers.json 成功创建")