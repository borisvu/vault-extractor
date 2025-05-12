# Vault Extractor

A Node.js CLI tool to combine Obsidian markdown files from specified vault folders into single output files.

## Installation

```bash
npm install
npm link  # To make the CLI command available globally
```

## Usage

```bash
combine-md --config <path-to-config>  # Process files using config
combine-md --init-config <path>       # Generate template config file
combine-md --config <path> --log <path>  # Process files and write logs
```

### Configuration File Format

```json
{
  "vault": "/absolute/path/to/vault",
  "folders": ["FolderA", "FolderB"],
  "output": "/absolute/path/to/output"
}
```

## Features

- Combines markdown files from specified Obsidian vault folders
- Preserves YAML frontmatter
- Maintains folder structure in headings
- Streams files for memory efficiency
- Progress visualization
- Detailed logging support

## Development

```bash
npm test  # Run tests
npm start -- --config <path>  # Run locally
```
