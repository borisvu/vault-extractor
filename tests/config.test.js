import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { initConfig, loadConfig } from '../src/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Config Management', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const testConfigPath = path.join(fixturesDir, 'test-init-config.json');

  beforeEach(async () => {
    // Clean up any existing test config
    try {
      await fs.unlink(testConfigPath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  });

  afterEach(async () => {
    // Clean up test config
    try {
      await fs.unlink(testConfigPath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  });

  describe('initConfig', () => {
    test('should create a template config file', async () => {
      await initConfig(testConfigPath);

      // Verify file was created
      const configExists = await fs
        .access(testConfigPath)
        .then(() => true)
        .catch(() => false);
      expect(configExists).toBe(true);

      // Verify content
      const content = JSON.parse(await fs.readFile(testConfigPath, 'utf8'));
      expect(content).toEqual({
        vault: '/path/to/your/vault',
        folders: ['FolderA', 'FolderB'],
        output: '/path/to/output/directory',
      });
    });

    test('should throw error if path is invalid', async () => {
      // Try to create config in a path that contains invalid characters
      const invalidPath = path.join(fixturesDir, 'test\0config.json');
      await expect(initConfig(invalidPath)).rejects.toThrow('Failed to initialize config');
    });

    test('should not overwrite existing config file', async () => {
      // Create initial config
      const initialContent = { test: 'initial' };
      await fs.writeFile(testConfigPath, JSON.stringify(initialContent));

      // Try to init config at same path
      await expect(initConfig(testConfigPath)).rejects.toThrow(
        'Failed to initialize config: Config file already exists'
      );

      // Verify original content was not changed
      const content = JSON.parse(await fs.readFile(testConfigPath, 'utf8'));
      expect(content).toEqual(initialContent);
    });
  });

  describe('loadConfig', () => {
    test('should load and validate config file', async () => {
      const config = {
        vault: fixturesDir,
        folders: ['folder1'],
        output: path.join(fixturesDir, 'output'),
      };
      await fs.writeFile(testConfigPath, JSON.stringify(config));

      const loadedConfig = await loadConfig(testConfigPath);
      expect(loadedConfig).toEqual({
        vault: path.resolve(fixturesDir),
        folders: ['folder1'],
        output: path.resolve(path.join(fixturesDir, 'output')),
      });
    });
  });
});
