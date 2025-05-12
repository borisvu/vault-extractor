import fs from "fs/promises";
import path from "path";

const DEFAULT_CONFIG = {
  vault: "/path/to/your/vault",
  folders: ["FolderA", "FolderB"],
  output: "/path/to/output/directory",
};

export async function initConfig(configPath) {
  const config = JSON.stringify(DEFAULT_CONFIG, null, 2);
  await fs.writeFile(configPath, config, "utf8");
}

export async function loadConfig(configPath) {
  let configContent;
  try {
    configContent = await fs.readFile(configPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Config file not found: ${configPath}`);
    }
    throw error;
  }

  try {
    const config = JSON.parse(configContent);

    // Validate required fields
    if (!config.vault || !config.folders || !config.output) {
      throw new Error("Config must contain vault, folders, and output fields");
    }

    // Ensure paths are absolute
    config.vault = path.resolve(config.vault);
    config.output = path.resolve(config.output);

    // Validate vault directory exists
    try {
      const vaultStats = await fs.stat(config.vault);
      if (!vaultStats.isDirectory()) {
        throw new Error(`Vault path is not a directory: ${config.vault}`);
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new Error(`Vault directory not found: ${config.vault}`);
      }
      throw error;
    }

    // Create output directory if it doesn't exist
    await fs.mkdir(config.output, { recursive: true });

    return config;
  } catch (error) {
    if (error.message.startsWith("Vault directory not found:")) {
      throw error;
    }
    throw new Error(`Invalid config file: ${error.message}`);
  }
}
