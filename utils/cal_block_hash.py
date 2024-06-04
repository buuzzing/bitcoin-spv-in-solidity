from binascii import unhexlify
from hashlib import sha256
import json


def little_endian(data: str) -> str:
    return "".join(reversed([data[i : i + 2] for i in range(0, len(data), 2)]))


def cal_hash(data: str) -> bytes:
    header = unhexlify(data)
    return sha256(sha256(header).digest())


if __name__ == "__main__":
    with open("raw_headers.json", "r") as file:
        data = json.load(file)

    for block_number, header in data.items():
        print(f"Block number: {block_number}")
        block_hash = little_endian(cal_hash(header).hexdigest())
        print(f"Block hash: {block_hash}")
        print()
