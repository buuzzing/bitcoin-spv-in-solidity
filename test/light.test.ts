import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { ErrorCode, BlockInfo } from "./constants";
import { utils } from "./utils"

describe("Light Client", () => {
    async function deployFixture() {
        // 获取默认账户列表
        const accounts = await hre.ethers.getSigners();

        // 部署 Utils Library，并获取地址
        const UTILS_CONTRACT = await hre.ethers.getContractFactory("Utils");
        const utils_contract = await UTILS_CONTRACT.deploy();
        const utils_addr = String(await utils_contract.getAddress());

        // 部署 Validate Library，并获取地址
        const VALIDATE = await hre.ethers.getContractFactory("Validate", {
            libraries: {
                Utils: utils_addr,
            },
        });
        const validate = await VALIDATE.deploy();
        const validate_addr = String(await validate.getAddress());

        // 部署 Light 合约
        const LIGHT = await hre.ethers.getContractFactory("Light", {
            libraries: {
                Utils: utils_addr,
                Validate: validate_addr,
            },
        });
        // @dev ts 中传入的 bytesLike 类型的十六进制串必须以 0x 开头
        // @dev 以下的 string 到 bytesLike 操作同理
        const genesis_header = "0x" + utils.getRawHeaderFromHeight(BlockInfo.GENESIS_HEIGHT);
        const light = await LIGHT.deploy(genesis_header, BlockInfo.GENESIS_HEIGHT);

        return { accounts, LIGHT, light };
    }

    describe("Deployment", () => {
        describe("Validation", () => {
            it("Should revert if the header's length is not 80 bytes", async () => {
                const { LIGHT } = await loadFixture(deployFixture);

                await expect(LIGHT.deploy("0x1234", 1)).to.be.revertedWith(ErrorCode.INVALID_HEADER_SIZE);
            });

            it("Should revert if the genesis height is not greater than 0", async () => {
                const { LIGHT } = await loadFixture(deployFixture);
                const genesis_header = "0x" + utils.getRawHeaderFromHeight(BlockInfo.GENESIS_HEIGHT);

                await expect(LIGHT.deploy(genesis_header, 0)).to.be.revertedWith(ErrorCode.INVALID_GENESIS);
            });

            it("Should set the right genesis header", async () => {
                const { light } = await loadFixture(deployFixture);

                // 最新区块高度和哈希已经更新
                const [header, height] = await light.getLatestBlock();
                const genesis_header = utils.getRawHeaderFromHeight(BlockInfo.GENESIS_HEIGHT);
                const genesis_header_hash = "0x" + utils.calculateBlockHash(genesis_header);

                expect(header).to.equal(genesis_header_hash);
                expect(height).to.equal(BlockInfo.GENESIS_HEIGHT);
            });
        });

        // TODO: 如何获取 constructor 中的抛出的事件？
        describe("Events", () => {
            it("Should emit a storeHeader event", async () => { });
        });
    });

    describe("Submit Block Header", () => {
        describe("Validation", () => {
            it("Should revert if the header's length is not 80 bytes", async () => {
                const { light } = await loadFixture(deployFixture);

                await expect(light.submitBlockHeader("0x1234")).to.be.revertedWith(ErrorCode.INVALID_HEADER_SIZE);
            });

            it("Should revert if the previous block does not exist", async () => {
                const { light } = await loadFixture(deployFixture);
                // 存储的创世纪块为 #120097，获取一个前序块不存在的块头
                const new_header = "0x" + utils.getRawHeaderFromHeight(120099);

                await expect(light.submitBlockHeader(new_header)).to.be.revertedWith(ErrorCode.PREV_BLOCK_NOT_FOUND);
            });

            it("Should revert if the block already exists", async () => {
                const { light } = await loadFixture(deployFixture);
                // 存储的创世纪块为 #120097，尝试再次提交
                const existing_header = "0x" + utils.getRawHeaderFromHeight(120097);

                await expect(light.submitBlockHeader(existing_header)).to.be.revertedWith(ErrorCode.BLOCK_EXISTS);
            });

            it("Should revert if the header's proof of work is insufficient", async () => {
                const { light } = await loadFixture(deployFixture);
                // 存储的创世纪块为 #120097，获取 #120098
                const header = utils.getRawHeaderFromHeight(120098);
                // 修改 nonce 为 0，#120098 这么修改后，将不再满足难度要求
                const new_header = "0x" + utils.changeHeaderNonce(header);

                await expect(light.submitBlockHeader(new_header)).to.be.revertedWith(ErrorCode.INSUFFICIENT_POW);
            });

            it("Should submit the block header successfully", async () => {
                const { light } = await loadFixture(deployFixture);
                // 存储的创世纪块为 #120097，获取 #120098
                const header = "0x" + utils.getRawHeaderFromHeight(120098);
                // 计算哈希时去掉开头的 0x
                const header_hash = "0x" + utils.calculateBlockHash(header.slice(2));

                await expect(light.submitBlockHeader(header)).not.to.be.reverted;

                // 最新区块高度和哈希已经更新
                const [latest_header, latest_height] = await light.getLatestBlock();
                expect(latest_header).to.equal(header_hash);
                expect(latest_height).to.equal(120098);
            });
        });

        describe("Events", () => {
            it("Should emit a storeHeader event", async () => {
                const { light } = await loadFixture(deployFixture);
                // 存储的创世纪块为 #120097，获取 #120098
                const header = "0x" + utils.getRawHeaderFromHeight(120098);
                const header_hash = "0x" + utils.calculateBlockHash(header.slice(2));

                await expect(light.submitBlockHeader(header))
                    .to.emit(light, "storeHeader")
                    .withArgs(header_hash, 120098);
            });
        });
    });

    describe("Get Block Hash", () => {
        it("Should revert if the block does not exist", async () => {
            const { light } = await loadFixture(deployFixture);
            // 存储的创世纪块为 #120097，尝试查询 #120098
            await expect(light.getBlockHash(120098)).to.be.revertedWith(ErrorCode.BLOCK_WITH_HEIGHT_NOT_FOUND);
        });

        it("Should return the block hash", async () => {
            const { light } = await loadFixture(deployFixture);
            // 存储的创世纪块为 #120097，提交 #120098
            const header = "0x" + utils.getRawHeaderFromHeight(120098);
            const header_hash = "0x" + utils.calculateBlockHash(header.slice(2));

            await light.submitBlockHeader(header);

            const block_hash = await light.getBlockHash(120098);
            expect(block_hash).to.equal(header_hash);
        });
    });

    describe("Get Block Height", () => {
        it("Should revert if the block does not exist", async () => {
            const { light } = await loadFixture(deployFixture);
            // 存储的创世纪块为 #120097，尝试查询 #120098
            const header = utils.getRawHeaderFromHeight(120098);
            const header_hash = "0x" + utils.calculateBlockHash(header);

            await expect(light.getBlockHeight(header_hash)).to.be.revertedWith(ErrorCode.BLOCK_WITH_HASH_NOT_FOUND);
        });

        it("Should return the block height", async () => {
            const { light } = await loadFixture(deployFixture);
            // 存储的创世纪块为 #120097，提交 #120098
            const header = "0x" + utils.getRawHeaderFromHeight(120098);
            const header_hash = "0x" + utils.calculateBlockHash(header.slice(2));

            await light.submitBlockHeader(header);

            const block_height = await light.getBlockHeight(header_hash);
            expect(block_height).to.equal(120098);
        });
    });

    describe("Get Latest Block", () => {
        it("Should return the latest block", async () => {
            const { light } = await loadFixture(deployFixture);
            // 存储的创世纪块为 #120097，提交 #120098
            const header = "0x" + utils.getRawHeaderFromHeight(120098);
            const header_hash = "0x" + utils.calculateBlockHash(header.slice(2));

            await light.submitBlockHeader(header);

            const [latest_header, latest_height] = await light.getLatestBlock();
            expect(latest_header).to.equal(header_hash);
            expect(latest_height).to.equal(120098);
        });
    });

    describe("Verify Transaction", () => {
        it("Should revert if the requested block does not exist", async () => {
            const { light } = await loadFixture(deployFixture);
            // 存储的创世纪块为 #120097，提交 #120098
            const header = "0x" + utils.getRawHeaderFromHeight(120098);
            await light.submitBlockHeader(header);
            // 不提交 #120099，直接尝试验证

            const height = 120099;
            const tx_index = 5;
            const [_tx_hash, _proof] = utils.makeTxWithProof();
            const tx_hash = "0x" + _tx_hash;
            const proof = "0x" + _proof;

            await expect(light.verityTx(height, tx_index, tx_hash, header, proof))
                .to.be.revertedWith(ErrorCode.BLOCK_WITH_HEIGHT_NOT_FOUND);
        });

        it("Should revert if the block hash does not match", async () => {
            const { light } = await loadFixture(deployFixture);
            // 存储的创世纪块为 #120097，提交 #120098
            let header = "0x" + utils.getRawHeaderFromHeight(120098);
            await light.submitBlockHeader(header);
            // 提交 #120099
            header = "0x" + utils.getRawHeaderFromHeight(120099);
            await light.submitBlockHeader(header);

            // 修改 #120099 的块头（通过改 nonce 值）
            const fake_header = "0x" + utils.changeHeaderNonce(utils.getRawHeaderFromHeight(120099));

            const height = 120099;
            const tx_index = 5;
            const [_tx_hash, _proof] = utils.makeTxWithProof();
            const tx_hash = "0x" + _tx_hash;
            const proof = "0x" + _proof;

            await expect(light.verityTx(height, tx_index, tx_hash, fake_header, proof))
                .to.be.revertedWith(ErrorCode.BLOCK_WITH_HASH_NOT_FOUND);
        });

        it("Should fail if the merkle proof is invalid", async () => {
            const { light } = await loadFixture(deployFixture);
            // 存储的创世纪块为 #120097，提交 #120098
            let header = "0x" + utils.getRawHeaderFromHeight(120098);
            await light.submitBlockHeader(header);
            // 提交 #120099
            header = "0x" + utils.getRawHeaderFromHeight(120099);
            await light.submitBlockHeader(header);

            const height = 120099;
            const tx_index = 5;
            const [_tx_hash, _proof] = utils.makeTxWithProof();
            const tx_hash = "0x" + _tx_hash;
            // 修改 proof 中的一个字节
            const proof = "0x" + _proof.slice(0, 2) + "00" + _proof.slice(4);

            const result = await light.verityTx(height, tx_index, tx_hash, header, proof);
            expect(result).to.equal(false);
        });

        it("Should verify the transaction", async () => {
            const { light } = await loadFixture(deployFixture);
            // 存储的创世纪块为 #120097，提交 #120098
            let header = "0x" + utils.getRawHeaderFromHeight(120098);
            await light.submitBlockHeader(header);
            // 提交 #120099
            header = "0x" + utils.getRawHeaderFromHeight(120099);
            await light.submitBlockHeader(header);

            // 测试使用 #120099 块的 #5 交易，参见 utils.makeTxWithProof 函数
            const height = 120099;
            const tx_index = 5;
            const [_tx_hash, _proof] = utils.makeTxWithProof();
            const tx_hash = "0x" + _tx_hash;
            const proof = "0x" + _proof;

            const result = await light.verityTx(height, tx_index, tx_hash, header, proof);
            expect(result).to.equal(true);
        });
    });
});