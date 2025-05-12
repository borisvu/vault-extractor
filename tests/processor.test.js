import { jest } from "@jest/globals";
import fs from "fs/promises";
import path from "path";
import { processVault } from "../src/processor.js";

// Mock the file system modules
jest.mock("fs/promises");
jest.mock("fs", () => ({
  createReadStream: jest.fn(),
  createWriteStream: jest.fn(),
}));

// Mock the logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe("processVault", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should process vault with valid config", async () => {
    // Mock config file content
    const mockConfig = {
      vault: "/test/vault",
      folders: ["folder1"],
      output: "/test/output",
    };

    // Mock file system operations
    fs.readFile.mockResolvedValue(JSON.stringify(mockConfig));
    fs.stat.mockResolvedValue({ isDirectory: () => true });
    fs.mkdir.mockResolvedValue();
    fs.readdir.mockResolvedValue([
      { name: "test.md", isFile: () => true, isDirectory: () => false },
    ]);

    // Execute the function
    await processVault("/test/config.json", mockLogger);

    // Verify the logger was called
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("Processing complete")
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("Total folders processed: 1")
    );
  });

  test("should handle missing vault directory", async () => {
    const mockConfig = {
      vault: "/nonexistent",
      folders: ["folder1"],
      output: "/test/output",
    };

    fs.readFile.mockResolvedValue(JSON.stringify(mockConfig));
    fs.stat.mockRejectedValue(new Error("ENOENT"));

    await expect(
      processVault("/test/config.json", mockLogger)
    ).rejects.toThrow();
  });
});
