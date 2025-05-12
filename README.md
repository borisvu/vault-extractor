# Vault Extractor

A powerful Node.js CLI tool for combining and processing Obsidian markdown files from specified vault folders. Perfect for creating consolidated exports, backups, or sharing specific sections of your vault.

## Features

- 📁 Process multiple vault folders into single files
- ✨ Preserve YAML frontmatter with validation
- 🌳 Maintain folder structure in headings
- 🚀 Stream-based processing for memory efficiency
- 📊 Real-time progress visualization
- 📝 Detailed logging support
- ⚡ Fast and efficient file handling

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/vault-extractor.git
cd vault-extractor

# Install dependencies
npm install

# Link globally (optional)
npm link
```

## Quick Start

1. Generate a template configuration file:

```bash
combine-md --init-config=config.json
# OR
combine-md --init-config config.json
```

2. Edit the configuration file:

```json
{
  "vault": "/path/to/your/obsidian/vault",
  "folders": ["Projects", "Research", "Daily Notes"],
  "output": "/path/to/output/directory"
}
```

3. Run the extractor:

```bash
combine-md --config config.json
```

## Usage

### Command Line Options

```bash
combine-md [options]

Options:
  --config, -c       Path to configuration file                   [string] [required]
  --log, -l         Path to log file                             [string]
  --init-config     Path where to create template config file     [string] [requires argument]
  --help            Show help                                    [boolean]

Examples:
  combine-md --init-config=config.json     Create template config file
  combine-md --config config.json          Process vault using config file
  combine-md -c config.json -l app.log     Process vault with logging enabled
```

### Configuration File

The configuration file (`config.json`) supports the following options:

```json
{
  "vault": "/absolute/path/to/vault", // Your Obsidian vault path
  "folders": [
    // Folders to process
    "Projects", // Will create Projects.md
    "Research/Papers", // Will create Research/Papers.md
    "Daily Notes/2024" // Will create Daily Notes/2024.md
  ],
  "output": "/path/to/output" // Output directory for combined files
}
```

### Example

Let's say you have an Obsidian vault with the following structure:

```
MyVault/
├── Projects/
│   ├── Project A/
│   │   ├── Overview.md
│   │   └── Tasks.md
│   └── Project B/
│       └── Notes.md
└── Research/
    └── Papers/
        ├── Paper1.md
        └── Paper2.md
```

With this configuration:

```json
{
  "vault": "/path/to/MyVault",
  "folders": ["Projects", "Research/Papers"],
  "output": "/path/to/output"
}
```

Running:

```bash
combine-md --config config.json --log processing.log
```

Will generate:

```
output/
├── Projects.md
└── Research/
    └── Papers.md
```

Where `Projects.md` might look like:

```markdown
# Project A/Overview

---

title: Project A Overview
date: 2024-03-20
tags: [project, overview]

---

Project A overview content...

# Project A/Tasks

---

title: Project A Tasks
date: 2024-03-20
tags: [project, tasks]

---

Project A tasks content...

# Project B/Notes

---

title: Project B Notes
date: 2024-03-20
tags: [project, notes]

---

Project B notes content...
```

### Logging

Enable logging to track processing details:

```bash
combine-md --config config.json --log ./logs/processing.log
```

Log output includes:

- File processing status
- Invalid frontmatter warnings
- Processing statistics
- Error details (if any)

## Error Handling

The tool handles various error conditions:

- Invalid configuration
- Missing vault or folders
- Invalid frontmatter
- File access issues
- Processing errors

Errors are:

- Logged to console and log file (if specified)
- Include detailed error messages
- Maintain processing state for other files

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### Linting

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
