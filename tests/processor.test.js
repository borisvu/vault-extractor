import { jest } from "@jest/globals";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { processVault } from "../src/processor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe("processVault Integration Tests", () => {
  const fixturesDir = path.join(__dirname, "fixtures");
  const configPath = path.join(fixturesDir, "test-config.json");
  const outputDir = path.join(fixturesDir, "output");
  const invalidFile = path.join(fixturesDir, "vault", "folder1", "invalid.md");

  beforeEach(async () => {
    // Clear the output directory and any test files
    try {
      await fs.rm(outputDir, { recursive: true, force: true });
      await fs.rm(invalidFile, { force: true });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    await fs.mkdir(outputDir, { recursive: true });

    // Clear mock calls
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(invalidFile, { force: true });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  });

  test("should process vault with valid config", async () => {
    // Process the vault
    await processVault(configPath, mockLogger);

    // Verify output files were created
    const folder1Output = await fs.readFile(
      path.join(outputDir, "folder1.md"),
      "utf8"
    );
    const folder2Output = await fs.readFile(
      path.join(outputDir, "folder2.md"),
      "utf8"
    );

    // Check folder1 output
    expect(folder1Output).toContain("title: Test Document 1");
    expect(folder1Output).toContain("title: Test Document 2");
    expect(folder1Output).toContain("This is a test document in folder1");
    expect(folder1Output).toContain("This is a test document in a subfolder");

    // Check folder2 output
    expect(folder2Output).toContain("title: Test Document 3");
    expect(folder2Output).toContain("This is a test document in folder2");

    // Verify logger calls
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("Processing complete")
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("Total folders processed: 2")
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("Total files processed: 3/3")
    );
  });

  test("should handle missing vault directory", async () => {
    // Create config with non-existent vault
    const invalidConfig = {
      vault: path.join(fixturesDir, "nonexistent"),
      folders: ["folder1"],
      output: outputDir,
    };
    const invalidConfigPath = path.join(outputDir, "invalid-config.json");
    await fs.writeFile(invalidConfigPath, JSON.stringify(invalidConfig));

    // Verify error is thrown
    await expect(processVault(invalidConfigPath, mockLogger)).rejects.toThrow(
      "Vault directory not found"
    );
  });

  test("should handle invalid frontmatter", async () => {
    // Create a file with invalid frontmatter
    const invalidFrontmatterDir = path.join(fixturesDir, "vault", "folder1");
    const invalidFile = path.join(invalidFrontmatterDir, "invalid.md");
    await fs.writeFile(
      invalidFile,
      `---
title: Invalid
date: not-a-date
---

Invalid frontmatter test`
    );

    // Process the vault
    await processVault(configPath, mockLogger);

    // Verify warning was logged
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining(`Invalid frontmatter in ${invalidFile}`)
    );

    // Verify file was still processed
    const folder1Output = await fs.readFile(
      path.join(outputDir, "folder1.md"),
      "utf8"
    );
    expect(folder1Output).toContain("Invalid frontmatter test");

    // Clean up
    await fs.unlink(invalidFile);
  });
});
