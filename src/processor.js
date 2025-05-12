import fs from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import path from "path";
import yaml from "js-yaml";
import cliProgress from "cli-progress";
import { loadConfig } from "./config.js";

async function findMarkdownFiles(dir) {
  const files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items.sort((a, b) => a.name.localeCompare(b.name))) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...(await findMarkdownFiles(fullPath)));
    } else if (item.isFile() && item.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function processFile(filePath, writeStream, relativePath, logger) {
  return new Promise((resolve, reject) => {
    let frontmatterContent = "";
    let inFrontmatter = false;
    let frontmatterProcessed = false;
    let buffer = "";

    const readStream = createReadStream(filePath, { encoding: "utf8" });

    readStream.on("data", (chunk) => {
      if (frontmatterProcessed) {
        writeStream.write(chunk);
        return;
      }

      buffer += chunk;

      // Check for frontmatter start
      if (!inFrontmatter && buffer.startsWith("---\n")) {
        inFrontmatter = true;
        frontmatterContent = "";
      }

      if (inFrontmatter) {
        const endIndex = buffer.indexOf("\n---\n", 4);
        if (endIndex !== -1) {
          frontmatterContent = buffer.slice(4, endIndex);
          frontmatterProcessed = true;

          try {
            const fmData = yaml.load(frontmatterContent);

            // Validate frontmatter structure
            if (typeof fmData !== "object" || fmData === null) {
              throw new Error("Frontmatter must be a valid YAML object");
            }

            // Validate date field if present
            if (fmData.date && isNaN(Date.parse(fmData.date))) {
              throw new Error("Invalid date format in frontmatter");
            }

            // Write the heading and valid frontmatter
            writeStream.write(`\n# ${relativePath}\n\n`);
            writeStream.write("---\n");
            writeStream.write(frontmatterContent);
            writeStream.write("\n---\n");

            // Write remaining content
            const remaining = buffer.slice(endIndex + 4);
            if (remaining) writeStream.write(remaining);
          } catch (error) {
            logger.warn(`Invalid frontmatter in ${filePath}: ${error.message}`);
            // Write content without parsing frontmatter
            writeStream.write(`\n# ${relativePath}\n\n`);
            writeStream.write("---\n");
            writeStream.write(frontmatterContent);
            writeStream.write("\n---\n");
            const remaining = buffer.slice(endIndex + 4);
            if (remaining) writeStream.write(remaining);
          }

          buffer = "";
        }
      } else if (buffer.length > 3 && !buffer.startsWith("---\n")) {
        // No frontmatter found, write directly
        frontmatterProcessed = true;
        writeStream.write(`\n# ${relativePath}\n\n`);
        writeStream.write(buffer);
        buffer = "";
      }
    });

    readStream.on("end", () => {
      if (!frontmatterProcessed && buffer) {
        // Handle any remaining content
        writeStream.write(`\n# ${relativePath}\n\n`);
        writeStream.write(buffer);
      }
      writeStream.write("\n\n");
      resolve();
    });

    readStream.on("error", (error) => {
      reject(error);
    });
  });
}

export async function processVault(configPath, logger) {
  const config = await loadConfig(configPath);
  const allFiles = new Map(); // Track all files to avoid duplicates
  const processedFiles = new Set(); // Track successfully processed files

  // Create progress bar
  const progressBar = new cliProgress.SingleBar({
    format: "Processing |{bar}| {percentage}% || {value}/{total} files",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
  });

  try {
    // First pass: collect all files
    for (const folder of config.folders) {
      const sourceDir = path.join(config.vault, folder);
      try {
        const files = await findMarkdownFiles(sourceDir);
        files.forEach((file) => allFiles.set(file, folder));
      } catch (error) {
        logger.warn(`Skipping folder ${folder}: ${error.message}`);
      }
    }

    const totalFiles = allFiles.size;
    progressBar.start(totalFiles, 0);

    // Second pass: process files
    for (const [file, folder] of allFiles) {
      const sourceDir = path.join(config.vault, folder);
      const outputPath = path.join(config.output, `${folder}.md`);

      try {
        // Create or append to write stream
        const writeStream = createWriteStream(outputPath, { flags: "a" });
        const relativePath = path.relative(sourceDir, file);

        await processFile(file, writeStream, relativePath, logger);
        processedFiles.add(file);
        progressBar.update(processedFiles.size);

        writeStream.end();
      } catch (error) {
        logger.error(`Error processing ${file}: ${error.message}`);
      }
    }

    // Log final statistics
    logger.info("Processing complete");
    logger.info(`Total folders processed: ${config.folders.length}`);
    logger.info(`Total files processed: ${processedFiles.size}/${totalFiles}`);
  } finally {
    progressBar.stop();
  }

  return {
    totalFiles: allFiles.size,
    processedFiles: processedFiles.size,
  };
}
