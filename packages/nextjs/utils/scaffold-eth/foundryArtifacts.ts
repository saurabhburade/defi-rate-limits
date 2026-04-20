import { GenericContractsDeclaration } from "./contract";
import fs from "fs";
import path from "path";
import { Address } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";

type FoundryArtifact = {
  bytecode?: {
    object?: string;
  };
};

const OPCODE_NAMES: Record<number, string> = {
  0x00: "STOP",
  0x01: "ADD",
  0x02: "MUL",
  0x03: "SUB",
  0x04: "DIV",
  0x05: "SDIV",
  0x06: "MOD",
  0x07: "SMOD",
  0x08: "ADDMOD",
  0x09: "MULMOD",
  0x0a: "EXP",
  0x0b: "SIGNEXTEND",
  0x10: "LT",
  0x11: "GT",
  0x12: "SLT",
  0x13: "SGT",
  0x14: "EQ",
  0x15: "ISZERO",
  0x16: "AND",
  0x17: "OR",
  0x18: "XOR",
  0x19: "NOT",
  0x1a: "BYTE",
  0x1b: "SHL",
  0x1c: "SHR",
  0x1d: "SAR",
  0x20: "SHA3",
  0x30: "ADDRESS",
  0x31: "BALANCE",
  0x32: "ORIGIN",
  0x33: "CALLER",
  0x34: "CALLVALUE",
  0x35: "CALLDATALOAD",
  0x36: "CALLDATASIZE",
  0x37: "CALLDATACOPY",
  0x38: "CODESIZE",
  0x39: "CODECOPY",
  0x3a: "GASPRICE",
  0x3b: "EXTCODESIZE",
  0x3c: "EXTCODECOPY",
  0x3d: "RETURNDATASIZE",
  0x3e: "RETURNDATACOPY",
  0x3f: "EXTCODEHASH",
  0x40: "BLOCKHASH",
  0x41: "COINBASE",
  0x42: "TIMESTAMP",
  0x43: "NUMBER",
  0x44: "PREVRANDAO",
  0x45: "GASLIMIT",
  0x46: "CHAINID",
  0x47: "SELFBALANCE",
  0x48: "BASEFEE",
  0x49: "BLOBHASH",
  0x4a: "BLOBBASEFEE",
  0x50: "POP",
  0x51: "MLOAD",
  0x52: "MSTORE",
  0x53: "MSTORE8",
  0x54: "SLOAD",
  0x55: "SSTORE",
  0x56: "JUMP",
  0x57: "JUMPI",
  0x58: "PC",
  0x59: "MSIZE",
  0x5a: "GAS",
  0x5b: "JUMPDEST",
  0x5c: "TLOAD",
  0x5d: "TSTORE",
  0x5e: "MCOPY",
  0x5f: "PUSH0",
  0xa0: "LOG0",
  0xa1: "LOG1",
  0xa2: "LOG2",
  0xa3: "LOG3",
  0xa4: "LOG4",
  0xf0: "CREATE",
  0xf1: "CALL",
  0xf2: "CALLCODE",
  0xf3: "RETURN",
  0xf4: "DELEGATECALL",
  0xf5: "CREATE2",
  0xfa: "STATICCALL",
  0xfd: "REVERT",
  0xfe: "INVALID",
  0xff: "SELFDESTRUCT",
};

const getFoundryOutDir = () => {
  const candidates = [
    path.join(process.cwd(), "packages", "foundry", "out"),
    path.join(process.cwd(), "..", "foundry", "out"),
    path.join(process.cwd(), "..", "..", "packages", "foundry", "out"),
  ];

  return candidates.find(candidate => fs.existsSync(candidate));
};

export const getContractNameForAddress = (address: Address) => {
  const contracts = deployedContracts as GenericContractsDeclaration | null;
  if (!contracts) {
    return null;
  }

  for (const deployedContractsOnChain of Object.values(contracts)) {
    for (const [contractName, contractInfo] of Object.entries(deployedContractsOnChain)) {
      if (contractInfo.address.toLowerCase() === address.toLowerCase()) {
        return contractName;
      }
    }
  }

  return null;
};

const disassembleBytecode = (bytecode: string) => {
  if (!bytecode || !bytecode.startsWith("0x")) {
    return "";
  }

  const bytes = bytecode.slice(2);
  const lines: string[] = [];

  for (let index = 0; index < bytes.length; ) {
    const opcode = Number.parseInt(bytes.slice(index, index + 2), 16);
    const name = OPCODE_NAMES[opcode] ?? `OP_0x${opcode.toString(16).padStart(2, "0").toUpperCase()}`;
    index += 2;

    if (opcode >= 0x60 && opcode <= 0x7f) {
      const pushLength = opcode - 0x5f;
      const pushData = bytes.slice(index, index + pushLength * 2);
      index += pushLength * 2;
      lines.push(`${name} 0x${pushData}`);
      continue;
    }

    lines.push(name);
  }

  return lines.join("\n");
};

export const getFoundryContractData = (address: Address) => {
  const contractName = getContractNameForAddress(address);
  if (!contractName) {
    return null;
  }

  const outDir = getFoundryOutDir();
  if (!outDir) {
    throw new Error("Foundry artifacts directory not found.");
  }

  const artifactPath = path.join(outDir, `${contractName}.sol`, `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    return null;
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8")) as FoundryArtifact;
  const bytecode = artifact.bytecode?.object || "";

  return {
    bytecode,
    assembly: disassembleBytecode(bytecode),
  };
};
