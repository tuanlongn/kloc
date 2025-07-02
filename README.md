# Git KLOC Statistics Tool

A powerful TypeScript tool for analyzing KLOC (Kilo Lines of Code) statistics from Git repositories. This tool provides detailed insights into code contributions by email, making it perfect for team productivity analysis and code review processes.

## Features

✨ **Email-based Statistics**: Groups contributions by email address for accurate contributor analysis
🚀 **High Performance**: Optimized for large repositories with 50MB buffer support
📊 **Detailed Reports**: Comprehensive statistics including KLOC, lines added/deleted, and commit counts
📁 **CSV Export**: Export results to CSV format for further analysis
⚡ **Flexible Date Ranges**: Analyze specific time periods or entire repository history
🎯 **Progress Tracking**: Real-time progress indicators for large repositories

## Quick Start

Get started in seconds! No installation required:

```bash
# Analyze your current project
npx git-kloc-analyzer -r .

# Analyze any Git repository
npx git-kloc-analyzer -r /path/to/your/repository

# Export results to CSV
npx git-kloc-analyzer -r . -o team-stats.csv
```

## Installation

### Option 1: Using npx (Recommended)

```bash
# Run directly without installation
npx git-kloc-analyzer -r /path/to/your/repository
```

### Option 2: Global Installation

```bash
# Install globally
npm install -g git-kloc-analyzer

# Then use anywhere
git-kloc-analyzer -r /path/to/your/repository
```

### Option 3: Local Development

```bash
# Clone the repository
git clone <repository-url>
cd k-loc

# Install dependencies
yarn install

# Build the project
yarn build
```

## Usage

### Quick Start with npx

```bash
# Analyze entire repository history
npx git-kloc-analyzer -r /path/to/your/repository

# Analyze with date range
npx git-kloc-analyzer -r /path/to/repo -f 2024-01-01 -t 2024-12-31

# Export to CSV
npx git-kloc-analyzer -r /path/to/repo -o results.csv
```

### Using Global Installation

```bash
# Basic analysis
git-kloc-analyzer -r /path/to/your/repository

# With custom output file
git-kloc-analyzer -r /path/to/repo -o team-stats.csv

# Disable progress output
git-kloc-analyzer -r /path/to/repo --no-progress
```

### Using Local Build

```bash
# Analyze entire repository history
node dist/kloc.js -r /path/to/your/repository

# Or using yarn
yarn start -r /path/to/your/repository
```

### Command Line Options

| Option | Description | Required | Default |
|--------|-------------|----------|----------|
| `-r, --repo <path>` | Path to the Git repository | ✅ | - |
| `-f, --from <date>` | Start date (YYYY-MM-DD) | ❌ | 1970-01-01 |
| `-t, --to <date>` | End date (YYYY-MM-DD) | ❌ | Today |
| `-o, --output <file>` | Save results to CSV file | ❌ | - |
| `--no-progress` | Disable progress output | ❌ | false |
| `-h, --help` | Display help information | ❌ | - |
| `-V, --version` | Display version number | ❌ | - |

## Output Format

The tool provides a comprehensive report including:

### Console Output
```
===============================================================================================
GIT KLOC STATISTICS REPORT
===============================================================================================

Email                                    KLOC    Added   Deleted       Net  Commits
-----------------------------------------------------------------------------------------------
# 1 developer@example.com               49.65   49,651     2,642    47,009       89
# 2 another@example.com                  5.36    5,356     2,302     3,054       95
-----------------------------------------------------------------------------------------------
TOTAL                                   55.01   55,007     4,944    50,063      184
===============================================================================================

Summary:
- Total contributors: 2
- Average KLOC per contributor: 27.51
- Average commits per contributor: 92.0
- Top contributor: developer@example.com (49.65 KLOC)

Total execution time: 0.85 seconds
```

### CSV Export Format
```csv
Author,Email,KLOC,Lines Added,Lines Deleted,Net Lines,Commits
Developer Name,developer@example.com,49.65,49651,2642,47009,89
Another Developer,another@example.com,5.36,5356,2302,3054,95
```

## Technical Features

### Performance Optimizations
- **Large Repository Support**: 50MB buffer for handling repositories with 10,000+ commits
- **Optimized Git Commands**: Uses `git log --numstat` for efficient statistics collection
- **Memory Management**: Intelligent fallback mechanisms for memory-constrained environments

### Email-based Grouping
- **Accurate Attribution**: Groups commits by email address rather than username
- **Handles Multiple Usernames**: Same person with different usernames but same email gets properly grouped
- **Clean Statistics**: Eliminates duplicate contributors from different machines/configurations

## Examples

### Analyze a Large Repository
```bash
# For repositories with thousands of commits
npx git-kloc-analyzer -r /path/to/large-repo
```

### Team Productivity Analysis
```bash
# Analyze last quarter
npx git-kloc-analyzer -r /path/to/repo -f 2024-10-01 -t 2024-12-31 -o q4-2024.csv
```

### Code Review Preparation
```bash
# Analyze recent changes
npx git-kloc-analyzer -r /path/to/repo -f 2024-12-01 --no-progress
```

### Real-world Use Cases
```bash
# Quick analysis of current project
npx git-kloc-analyzer -r .

# Monthly team report
npx git-kloc-analyzer -r . -f 2024-12-01 -t 2024-12-31 -o monthly-report.csv

# Compare contributions between team members
npx git-kloc-analyzer -r /path/to/project --no-progress

# Analyze specific time period for performance review
npx git-kloc-analyzer -r . -f 2024-01-01 -t 2024-06-30 -o h1-2024.csv
```

## Development

### Project Structure
```
k-loc/
├── src/
│   └── kloc.ts          # Main source code
├── dist/                # Compiled JavaScript
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

### Available Scripts
```bash
yarn build              # Compile TypeScript to JavaScript
yarn start              # Run the tool (requires build first)
yarn dev                # Development mode with ts-node
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Requirements

### For npx usage (Recommended)
- Node.js 14+
- Git repository access

### For local development
- Node.js 14+ 
- TypeScript 4+
- Git repository access
- Yarn package manager

## License

MIT License - see LICENSE file for details

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and release notes.