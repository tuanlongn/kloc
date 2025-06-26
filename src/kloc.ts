#!/usr/bin/env node

import { Command } from "commander";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface ContributorStats {
  author: string;
  email: string;
  linesAdded: number;
  linesDeleted: number;
  netLines: number;
  commits: number;
  kloc: number;
}

interface CommitInfo {
  hash: string;
  author: string;
  email: string;
  date: string;
  subject: string;
}

class GitKlocAnalyzer {
  private repoPath: string;
  private fromDate: string;
  private toDate: string;

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
      });
      return result.toString().trim();
    } catch (error) {
      throw new Error(`Git command failed: ${command}\nError: ${error}`);
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

  private getCommitsInRange(): CommitInfo[] {
    const gitLogCommand = `git log --since="${this.fromDate}" --until="${this.toDate}" --pretty=format:"%H|%an|%ae|%ad|%s" --date=short`;
    const output = this.executeGitCommand(gitLogCommand);

    if (!output) {
      return [];
    }

    return output.split("\n").map((line) => {
      const [hash, author, email, date, subject] = line.split("|");
      return { hash, author, email, date, subject };
    });
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

    commits.forEach((commit, index) => {
      if (index % 10 === 0) {
        console.log(
          `Progress: ${index + 1}/${commits.length} commits processed`
        );
      }

      const authorKey = `${commit.author} <${commit.email}>`;

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
      const commitStats = this.getCommitStats(commit.hash);

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

    return results;
  }
}

function displayResults(stats: ContributorStats[]): void {
  console.log("\n" + "=".repeat(100));
  console.log("GIT KLOC STATISTICS REPORT");
  console.log("=".repeat(100));

  if (stats.length === 0) {
    console.log("No contributors found in the specified date range.");
    return;
  }

  console.log(
    `${"Author".padEnd(30)} ${"Email".padEnd(35)} ${"KLOC".padStart(
      8
    )} ${"Added".padStart(8)} ${"Deleted".padStart(8)} ${"Net".padStart(
      8
    )} ${"Commits".padStart(8)}`
  );
  console.log("-".repeat(100));

  let totalKloc = 0;
  let totalAdded = 0;
  let totalDeleted = 0;
  let totalCommits = 0;

  stats.forEach((stat) => {
    console.log(
      `${stat.author.substring(0, 29).padEnd(30)} ` +
        `${stat.email.substring(0, 34).padEnd(35)} ` +
        `${stat.kloc.toFixed(2).padStart(8)} ` +
        `${stat.linesAdded.toString().padStart(8)} ` +
        `${stat.linesDeleted.toString().padStart(8)} ` +
        `${stat.netLines.toString().padStart(8)} ` +
        `${stat.commits.toString().padStart(8)}`
    );

    totalKloc += stat.kloc;
    totalAdded += stat.linesAdded;
    totalDeleted += stat.linesDeleted;
    totalCommits += stat.commits;
  });

  console.log("-".repeat(100));
  console.log(
    `${"TOTAL".padEnd(30)} ` +
      `${"".padEnd(35)} ` +
      `${totalKloc.toFixed(2).padStart(8)} ` +
      `${totalAdded.toString().padStart(8)} ` +
      `${totalDeleted.toString().padStart(8)} ` +
      `${(totalAdded - totalDeleted).toString().padStart(8)} ` +
      `${totalCommits.toString().padStart(8)}`
  );
  console.log("=".repeat(100));
}

function saveToFile(stats: ContributorStats[], filename: string): void {
  const csvContent = [
    "Author,Email,KLOC,Lines Added,Lines Deleted,Net Lines,Commits",
    ...stats.map(
      (stat) =>
        `"${stat.author}","${stat.email}",${stat.kloc},${stat.linesAdded},${stat.linesDeleted},${stat.netLines},${stat.commits}`
    ),
  ].join("\n");

  fs.writeFileSync(filename, csvContent);
  console.log(`\nResults saved to: ${filename}`);
}

async function main() {
  const program = new Command();

  program
    .name("git-kloc-stats")
    .description(
      "Analyze KLOC (Kilo Lines of Code) statistics for Git contributors"
    )
    .version("1.0.0")
    .requiredOption("-r, --repo <path>", "Path to the Git repository")
    .requiredOption("-f, --from <date>", "Start date (YYYY-MM-DD)")
    .requiredOption("-t, --to <date>", "End date (YYYY-MM-DD)")
    .option("-o, --output <file>", "Save results to CSV file")
    .parse();

  const options = program.opts();

  try {
    const analyzer = new GitKlocAnalyzer(
      options.repo,
      options.from,
      options.to
    );
    const stats = await analyzer.analyze();

    displayResults(stats);

    if (options.output) {
      saveToFile(stats, options.output);
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { GitKlocAnalyzer, ContributorStats };
