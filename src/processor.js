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
    let frontmatterStart = false;
    let frontmatterEnd = false;
    let frontmatter = "";
    let isFirstContent = true;

    const readStream = createReadStream(filePath, { encoding: "utf8" });

    readStream.on("data", (chunk) => {
      if (!frontmatterEnd) {
        frontmatter += chunk;
        const fmEndIndex = frontmatter.indexOf("---\n", 3);

        if (fmEndIndex !== -1) {
          frontmatterEnd = true;
          const fmContent = frontmatter.slice(0, fmEndIndex + 4);

          try {
            // Parse frontmatter to validate it
            const fmData = yaml.load(fmContent.slice(3, -4));

            // Write the heading and frontmatter
            writeStream.write(`\n# ${relativePath}\n\n`);
            writeStream.write(fmContent);

            // Write remaining content from this chunk
            const remainingContent = frontmatter.slice(fmEndIndex + 4);
            if (remainingContent) writeStream.write(remainingContent);
          } catch (error) {
            logger.warn(`Invalid frontmatter in ${filePath}: ${error.message}`);
            // Still write the content, but without parsing the frontmatter
            writeStream.write(`\n# ${relativePath}\n\n`);
            writeStream.write(frontmatter);
          }

          frontmatter = "";
        }
      } else {
        writeStream.write(chunk);
      }
    });

    readStream.on("end", () => {
      if (!frontmatterEnd && frontmatter) {
        // No frontmatter found, write the content directly
        writeStream.write(`\n# ${relativePath}\n\n`);
        writeStream.write(frontmatter);
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
  let totalFiles = 0;
  let processedFiles = 0;

  // Create progress bar
  const progressBar = new cliProgress.SingleBar({
    format: "Processing |{bar}| {percentage}% || {value}/{total} files",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
  });

  try {
    // Count total files first
    for (const folder of config.folders) {
      const sourceDir = path.join(config.vault, folder);
      try {
        const files = await findMarkdownFiles(sourceDir);
        totalFiles += files.length;
      } catch (error) {
        logger.warn(`Skipping folder ${folder}: ${error.message}`);
      }
    }

    progressBar.start(totalFiles, 0);

    // Process each folder
    for (const folder of config.folders) {
      const sourceDir = path.join(config.vault, folder);
      let outputPath = path.join(config.output, `${folder}.md`);

      try {
        const files = await findMarkdownFiles(sourceDir);
        if (files.length === 0) {
          logger.warn(`No markdown files found in ${folder}`);
          continue;
        }

        const writeStream = createWriteStream(outputPath);

        for (const file of files) {
          try {
            const relativePath = path.relative(sourceDir, file);
            await processFile(file, writeStream, relativePath, logger);
            processedFiles++;
            progressBar.update(processedFiles);
          } catch (error) {
            logger.error(`Error processing ${file}: ${error.message}`);
          }
        }

        writeStream.end();
        logger.info(`Created ${outputPath}`);
      } catch (error) {
        logger.error(`Error processing folder ${folder}: ${error.message}`);
      }
    }
  } finally {
    progressBar.stop();
  }

  logger.info(`\nProcessing complete:`);
  logger.info(`- Total folders processed: ${config.folders.length}`);
  logger.info(`- Total files processed: ${processedFiles}/${totalFiles}`);
}
