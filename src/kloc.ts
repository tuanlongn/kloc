#!/usr/bin/env node

import { Command } from "commander";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

/**
 * Statistics for a single contributor
 */
interface ContributorStats {
  author: string;
  email: string;
  linesAdded: number;
  linesDeleted: number;
  netLines: number;
  commits: number;
  kloc: number;
}

/**
 * Information about a single commit
 */
interface CommitInfo {
  hash: string;
  author: string;
  email: string;
  date: string;
  subject: string;
}

/**
 * Analyzer for calculating KLOC (Kilo Lines of Code) statistics from Git repositories
 */
class GitKlocAnalyzer {
  private repoPath: string;
  private fromDate: string;
  private toDate: string;

  /**
   * Creates a new GitKlocAnalyzer instance
   * @param repoPath - Path to the Git repository
   * @param fromDate - Start date in YYYY-MM-DD format
   * @param toDate - End date in YYYY-MM-DD format
   */
  constructor(repoPath: string, fromDate: string, toDate: string) {
    this.repoPath = repoPath;
    this.fromDate = fromDate;
    this.toDate = toDate;
  }

  private executeGitCommand(command: string): string {
    try {
      const result = execSync(command, {
        cwd: this.repoPath,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        maxBuffer: 1024 * 1024 * 50, // 50MB buffer for large repositories
      });
      return result.toString().trim();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Git command failed: ${command}\nError: ${errorMessage}`);
    }
  }

  private validateRepository(): void {
    if (!fs.existsSync(this.repoPath)) {
      throw new Error(`Repository path does not exist: ${this.repoPath}`);
    }

    if (!fs.existsSync(path.join(this.repoPath, ".git"))) {
      throw new Error(`Not a git repository: ${this.repoPath}`);
    }
  }

  private validateDateFormat(date: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(date) && !isNaN(Date.parse(date));
  }

  private validateDateRange(): void {
    if (!this.validateDateFormat(this.fromDate)) {
      throw new Error(`Invalid from date format: ${this.fromDate}. Expected YYYY-MM-DD`);
    }
    if (!this.validateDateFormat(this.toDate)) {
      throw new Error(`Invalid to date format: ${this.toDate}. Expected YYYY-MM-DD`);
    }
    if (new Date(this.fromDate) > new Date(this.toDate)) {
      throw new Error(`From date (${this.fromDate}) must be before to date (${this.toDate})`);
    }
  }

  private getCommitsInRange(): CommitInfo[] {
    const gitLogCommand = `git log --since="${this.fromDate}" --until="${this.toDate}" --pretty=format:"%H|%an|%ae|%ad|%s" --date=short`;
    const output = this.executeGitCommand(gitLogCommand);

    if (!output) {
      return [];
    }

    return output.split("\n").map((line) => {
      const parts = line.split("|");
      if (parts.length < 5) {
        console.warn(`Warning: Invalid commit line format: ${line}`);
        return null;
      }
      const [hash, author, email, date, subject] = parts;
      return { hash, author, email, date, subject };
    }).filter((commit): commit is CommitInfo => commit !== null);
  }

  private getAllCommitStatsOptimized(): Map<string, { added: number; deleted: number }> {
    try {
      const statsCommand = `git log --since="${this.fromDate}" --until="${this.toDate}" --numstat --pretty=format:"%H"`;
      const output = this.executeGitCommand(statsCommand);
      
      const commitStats = new Map<string, { added: number; deleted: number }>();
      
      if (!output) {
        return commitStats;
      }
      
      const lines = output.split("\n");
      let currentCommit = "";
      
      for (const line of lines) {
        if (line.match(/^[a-f0-9]{40}$/)) {
          // This is a commit hash
          currentCommit = line;
          commitStats.set(currentCommit, { added: 0, deleted: 0 });
        } else if (currentCommit && line.includes("\t")) {
          // This is a numstat line
          const parts = line.split("\t");
          if (parts.length >= 2) {
            const added = parts[0] === "-" ? 0 : parseInt(parts[0]) || 0;
            const deleted = parts[1] === "-" ? 0 : parseInt(parts[1]) || 0;
            const stats = commitStats.get(currentCommit)!;
            stats.added += added;
            stats.deleted += deleted;
          }
        }
      }
      
      return commitStats;
    } catch (error) {
      console.warn(`Warning: Could not get optimized stats, falling back to individual commits`);
      return new Map();
    }
  }

  private getCommitStats(commitHash: string): {
    added: number;
    deleted: number;
  } {
    try {
      const statsCommand = `git show --numstat --format="" ${commitHash}`;
      const output = this.executeGitCommand(statsCommand);

      let totalAdded = 0;
      let totalDeleted = 0;

      if (output) {
        const lines = output.split("\n").filter((line) => line.trim());
        for (const line of lines) {
          const parts = line.split("\t");
          if (parts.length >= 2) {
            const added = parts[0] === "-" ? 0 : parseInt(parts[0]) || 0;
            const deleted = parts[1] === "-" ? 0 : parseInt(parts[1]) || 0;
            totalAdded += added;
            totalDeleted += deleted;
          }
        }
      }

      return { added: totalAdded, deleted: totalDeleted };
    } catch (error) {
      console.warn(`Warning: Could not get stats for commit ${commitHash}`);
      return { added: 0, deleted: 0 };
    }
  }

  private aggregateStatsByAuthor(
    commits: CommitInfo[]
  ): Map<string, ContributorStats> {
    const authorStats = new Map<string, ContributorStats>();

    console.log(`Processing ${commits.length} commits...`);

    // Try optimized approach first
    const allCommitStats = this.getAllCommitStatsOptimized();
    const useOptimized = allCommitStats.size > 0;

    if (useOptimized) {
      console.log('Using optimized stats collection...');
    }

    commits.forEach((commit, index) => {
      if (index % Math.max(1, Math.floor(commits.length / 10)) === 0) {
        const percentage = Math.round((index / commits.length) * 100);
        console.log(`Progress: ${percentage}% (${index + 1}/${commits.length} commits)`);
      }

      const authorKey = commit.email;

      if (!authorStats.has(authorKey)) {
        authorStats.set(authorKey, {
          author: commit.author,
          email: commit.email,
          linesAdded: 0,
          linesDeleted: 0,
          netLines: 0,
          commits: 0,
          kloc: 0,
        });
      }

      const stats = authorStats.get(authorKey)!;
      
      // Use optimized stats if available, otherwise fall back to individual commit stats
      const commitStats = useOptimized 
        ? allCommitStats.get(commit.hash) || { added: 0, deleted: 0 }
        : this.getCommitStats(commit.hash);

      stats.linesAdded += commitStats.added;
      stats.linesDeleted += commitStats.deleted;
      stats.commits += 1;
    });

    // Calculate net lines and KLOC
    authorStats.forEach((stats) => {
      stats.netLines = stats.linesAdded - stats.linesDeleted;
      stats.kloc = Math.round((stats.linesAdded / 1000) * 100) / 100; // Round to 2 decimal places
    });

    return authorStats;
  }

  public async analyze(): Promise<ContributorStats[]> {
    console.log(`Analyzing repository: ${this.repoPath}`);
    console.log(`Date range: ${this.fromDate} to ${this.toDate}`);

    this.validateRepository();
    this.validateDateRange();

    const commits = this.getCommitsInRange();
    console.log(`Found ${commits.length} commits in the specified date range`);

    if (commits.length === 0) {
      console.log("No commits found in the specified date range");
      return [];
    }

    const authorStats = this.aggregateStatsByAuthor(commits);

    // Convert to array and sort by KLOC descending
    const results = Array.from(authorStats.values()).sort(
      (a, b) => b.kloc - a.kloc
    );

    console.log('\nAnalysis completed successfully!');
    return results;
  }
}

/**
 * Formats a number with thousand separators
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Displays the analysis results in a formatted table
 */
function displayResults(stats: ContributorStats[]): void {
  console.log("\n" + "=".repeat(95));
  console.log("GIT KLOC STATISTICS REPORT");
  console.log("=".repeat(95));

  if (stats.length === 0) {
    console.log("No contributors found in the specified date range.");
    return;
  }

  console.log(
    `${"Email".padEnd(40)} ${"KLOC".padStart(
      8
    )} ${"Added".padStart(10)} ${"Deleted".padStart(10)} ${"Net".padStart(
      10
    )} ${"Commits".padStart(8)}`
  );
  console.log("-".repeat(95));

  let totalKloc = 0;
  let totalAdded = 0;
  let totalDeleted = 0;
  let totalCommits = 0;

  stats.forEach((stat, index) => {
    const rank = `#${(index + 1).toString().padStart(2)}`;
    console.log(
      `${rank} ${stat.email.substring(0, 37).padEnd(37)} ` +
        `${stat.kloc.toFixed(2).padStart(8)} ` +
        `${formatNumber(stat.linesAdded).padStart(10)} ` +
        `${formatNumber(stat.linesDeleted).padStart(10)} ` +
        `${formatNumber(stat.netLines).padStart(10)} ` +
        `${formatNumber(stat.commits).padStart(8)}`
    );

    totalKloc += stat.kloc;
    totalAdded += stat.linesAdded;
    totalDeleted += stat.linesDeleted;
    totalCommits += stat.commits;
  });

  console.log("-".repeat(95));
  console.log(
    `${"TOTAL".padEnd(40)} ` +
      `${totalKloc.toFixed(2).padStart(8)} ` +
      `${formatNumber(totalAdded).padStart(10)} ` +
      `${formatNumber(totalDeleted).padStart(10)} ` +
      `${formatNumber(totalAdded - totalDeleted).padStart(10)} ` +
      `${formatNumber(totalCommits).padStart(8)}`
  );
  console.log("=".repeat(95));
  
  // Display summary statistics
  console.log(`\nSummary:`);
  console.log(`- Total contributors: ${stats.length}`);
  console.log(`- Average KLOC per contributor: ${(totalKloc / stats.length).toFixed(2)}`);
  console.log(`- Average commits per contributor: ${(totalCommits / stats.length).toFixed(1)}`);
  if (stats.length > 0) {
    console.log(`- Top contributor: ${stats[0].author} (${stats[0].kloc.toFixed(2)} KLOC)`);
  }
}

/**
 * Escapes CSV field content to handle quotes and commas properly
 */
function escapeCsvField(field: string): string {
  if (field.includes('"') || field.includes(',') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Saves contributor statistics to a CSV file
 */
function saveToFile(stats: ContributorStats[], filename: string): void {
  try {
    const csvContent = [
      "Author,Email,KLOC,Lines Added,Lines Deleted,Net Lines,Commits",
      ...stats.map(
        (stat) =>
          `${escapeCsvField(stat.author)},${escapeCsvField(stat.email)},${stat.kloc},${stat.linesAdded},${stat.linesDeleted},${stat.netLines},${stat.commits}`
      ),
    ].join("\n");

    fs.writeFileSync(filename, csvContent, 'utf-8');
    console.log(`\nResults saved to: ${filename}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error saving file: ${errorMessage}`);
    throw error;
  }
}

/**
 * Main function to run the CLI application
 */
async function main() {
  const program = new Command();

  program
    .name("git-kloc-stats")
    .description(
      "Analyze KLOC (Kilo Lines of Code) statistics for Git contributors"
    )
    .version("1.1.0")
    .requiredOption("-r, --repo <path>", "Path to the Git repository")
    .option("-f, --from <date>", "Start date (YYYY-MM-DD), defaults to repository start")
    .option("-t, --to <date>", "End date (YYYY-MM-DD), defaults to current date")
    .option("-o, --output <file>", "Save results to CSV file")
    .option("--no-progress", "Disable progress output")
    .parse();

  const options = program.opts();

  try {
    const startTime = Date.now();
    
    // Set default dates if not provided
    const fromDate = options.from || '1970-01-01'; // Unix epoch start
    const toDate = options.to || new Date().toISOString().split('T')[0]; // Today's date
    
    const analyzer = new GitKlocAnalyzer(
      options.repo,
      fromDate,
      toDate
    );
    const stats = await analyzer.analyze();

    displayResults(stats);

    if (options.output) {
      saveToFile(stats, options.output);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\nTotal execution time: ${duration} seconds`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMessage);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { GitKlocAnalyzer, ContributorStats };
