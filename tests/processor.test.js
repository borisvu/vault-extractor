import { jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { processVault } from '../src/processor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('processVault Integration Tests', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const configPath = path.join(fixturesDir, 'test-config.json');
  const outputDir = path.join(fixturesDir, 'output');
  const invalidFile = path.join(fixturesDir, 'vault', 'folder1', 'invalid.md');

  beforeEach(async () => {
    // Clear the output directory and any test files
    try {
      await fs.rm(outputDir, { recursive: true, force: true });
      await fs.rm(invalidFile, { force: true });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
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
      if (error.code !== 'ENOENT') throw error;
    }
  });

  test('should process vault with valid config', async () => {
    // Process the vault
    await processVault(configPath, mockLogger);

    // Verify output files were created
    const folder1Output = await fs.readFile(path.join(outputDir, 'folder1.md'), 'utf8');
    const folder2Output = await fs.readFile(path.join(outputDir, 'folder2.md'), 'utf8');

    // Check folder1 output
    expect(folder1Output).toContain('title: Test Document 1');
    expect(folder1Output).toContain('title: Test Document 2');
    expect(folder1Output).toContain('This is a test document in folder1');
    expect(folder1Output).toContain('This is a test document in a subfolder');

    // Check folder2 output
    expect(folder2Output).toContain('title: Test Document 3');
    expect(folder2Output).toContain('This is a test document in folder2');

    // Verify logger calls
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Processing complete'));
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Total folders processed: 2')
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Total files processed: 3/3')
    );
  });

  test('should handle missing vault directory', async () => {
    // Create config with non-existent vault
    const invalidConfig = {
      vault: path.join(fixturesDir, 'nonexistent'),
      folders: ['folder1'],
      output: outputDir,
    };
    const invalidConfigPath = path.join(outputDir, 'invalid-config.json');
    await fs.writeFile(invalidConfigPath, JSON.stringify(invalidConfig));

    // Verify error is thrown
    await expect(processVault(invalidConfigPath, mockLogger)).rejects.toThrow(
      'No markdown files found in vault'
    );
  });

  test('should handle invalid frontmatter', async () => {
    // Create a file with invalid frontmatter
    const invalidFrontmatterDir = path.join(fixturesDir, 'vault', 'folder1');
    await fs.mkdir(invalidFrontmatterDir, { recursive: true });

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
    const folder1Output = await fs.readFile(path.join(outputDir, 'folder1.md'), 'utf8');
    expect(folder1Output).toContain('Invalid frontmatter test');
  });

  test('should process nested folders recursively', async () => {
    // Create a deeply nested structure
    const nestedDir = path.join(fixturesDir, 'vault', 'nested', 'subfolder', 'deep');
    await fs.mkdir(nestedDir, { recursive: true });

    // Create test files
    await fs.writeFile(
      path.join(nestedDir, 'deep-file.md'),
      `---
title: Deep File
---
Content in deep folder`
    );

    // Create a new config with nested folder
    const nestedConfig = {
      vault: path.join(fixturesDir, 'vault'),
      folders: ['nested'],
      output: outputDir,
    };
    const nestedConfigPath = path.join(outputDir, 'nested-config.json');
    await fs.writeFile(nestedConfigPath, JSON.stringify(nestedConfig));

    // Process the vault with nested config
    await processVault(nestedConfigPath, mockLogger);

    // Verify output
    const nestedOutput = await fs.readFile(path.join(outputDir, 'nested.md'), 'utf8');
    expect(nestedOutput).toContain('# subfolder/deep/deep-file.md');
    expect(nestedOutput).toContain('Content in deep folder');
  });

  test('should use last part of folder path for output file name', async () => {
    // Create a folder with path segments
    const segmentedDir = path.join(fixturesDir, 'vault', 'PARA', '2 Areas');
    await fs.mkdir(segmentedDir, { recursive: true });

    // Create test file
    await fs.writeFile(
      path.join(segmentedDir, 'test.md'),
      `---
title: Area Test
---
Content in areas`
    );

    // Create a new config with segmented folder path
    const segmentedConfig = {
      vault: path.join(fixturesDir, 'vault'),
      folders: ['PARA/2 Areas'],
      output: outputDir,
    };
    const segmentedConfigPath = path.join(outputDir, 'segmented-config.json');
    await fs.writeFile(segmentedConfigPath, JSON.stringify(segmentedConfig));

    // Process the vault with segmented config
    await processVault(segmentedConfigPath, mockLogger);

    // Verify output file is named after last segment
    const exists = await fs
      .access(path.join(outputDir, '2 Areas.md'))
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);

    // Verify content
    const areaOutput = await fs.readFile(path.join(outputDir, '2 Areas.md'), 'utf8');
    expect(areaOutput).toContain('# test.md');
    expect(areaOutput).toContain('Content in areas');
  });
});
