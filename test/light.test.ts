import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { ErrorCode, BlockInfo } from "./constants";
import { calculateBlockHash } from "./utils"

describe("Light Client", () => {
    async function deployFixture() {
        // 获取默认账户列表
        const accounts = await hre.ethers.getSigners();

        // 部署 Utils Library，并获取地址
        const UTILS = await hre.ethers.getContractFactory("Utils");
        const utils = await UTILS.deploy();
        const utils_addr = String(await utils.getAddress());

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
        const light = await LIGHT.deploy(BlockInfo.GENESIS_HEADER, BlockInfo.GENESIS_HEIGHT);

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

                await expect(LIGHT.deploy(BlockInfo.GENESIS_HEADER, 0)).to.be.revertedWith(ErrorCode.INVALID_GENESIS);
            });

            it("Should set the right genesis header", async () => {
                const { light } = await loadFixture(deployFixture);

                const [header, height] = await light.getLatestBlock();
                expect(header).to.equal(calculateBlockHash(BlockInfo.GENESIS_HEADER));
                expect(height).to.equal(BlockInfo.GENESIS_HEIGHT);
            });
        });

        // TODO: 如何获取 constructor 中的抛出的事件？
        describe("Events", () => {
            it("Should emit a storeHeader event", async () => {});
        });
    });
});
