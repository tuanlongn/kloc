/**
 * Type definitions for Git KLOC Statistics Tool
 */

/**
 * Statistics for a single contributor
 */
export interface ContributorStats {
  /** Author name from Git commits */
  author: string;
  /** Email address from Git commits */
  email: string;
  /** Lines of code added */
  linesAdded: number;
  /** Lines of code deleted */
  linesDeleted: number;
  /** Net lines (added - deleted) */
  netLines: number;
  /** Total number of commits */
  commits: number;
  /** Kilo Lines of Code (linesAdded / 1000) */
  kloc: number;
}

/**
 * Information about a single commit
 */
export interface CommitInfo {
  /** Commit hash */
  hash: string;
  /** Author name */
  author: string;
  /** Author email */
  email: string;
  /** Commit date */
  date: string;
  /** Commit message */
  message: string;
}

/**
 * Statistics for a single commit
 */
export interface CommitStats {
  /** Lines added in this commit */
  added: number;
  /** Lines deleted in this commit */
  deleted: number;
}

/**
 * Configuration options for the analyzer
 */
export interface AnalyzerOptions {
  /** Path to the Git repository */
  repoPath: string;
  /** Start date for analysis (YYYY-MM-DD) */
  fromDate?: string;
  /** End date for analysis (YYYY-MM-DD) */
  toDate?: string;
  /** Whether to show progress output */
  showProgress?: boolean;
  /** Maximum buffer size for Git commands */
  maxBuffer?: number;
}

/**
 * Summary statistics for the entire analysis
 */
export interface AnalysisSummary {
  /** Total number of contributors */
  totalContributors: number;
  /** Total KLOC across all contributors */
  totalKloc: number;
  /** Total commits analyzed */
  totalCommits: number;
  /** Average KLOC per contributor */
  averageKloc: number;
  /** Average commits per contributor */
  averageCommits: number;
  /** Top contributor by KLOC */
  topContributor: ContributorStats | null;
  /** Analysis execution time in seconds */
  executionTime: number;
}