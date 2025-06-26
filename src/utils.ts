/**
 * Utility functions for Git KLOC Statistics Tool
 */

import { ContributorStats, AnalysisSummary } from './types';

/**
 * Formats a number with thousand separators
 * @param num - Number to format
 * @returns Formatted string with commas as thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Escapes special characters in CSV fields
 * @param field - Field value to escape
 * @returns Escaped field value
 */
export function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Validates date format (YYYY-MM-DD)
 * @param date - Date string to validate
 * @returns True if date format is valid
 */
export function validateDateFormat(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(date) && !isNaN(Date.parse(date));
}

/**
 * Validates date range (from <= to)
 * @param fromDate - Start date
 * @param toDate - End date
 * @returns True if date range is valid
 */
export function validateDateRange(fromDate: string, toDate: string): boolean {
  if (!validateDateFormat(fromDate) || !validateDateFormat(toDate)) {
    return false;
  }
  return new Date(fromDate) <= new Date(toDate);
}

/**
 * Calculates summary statistics from contributor stats
 * @param stats - Array of contributor statistics
 * @param executionTime - Analysis execution time in seconds
 * @returns Summary statistics
 */
export function calculateSummary(stats: ContributorStats[], executionTime: number): AnalysisSummary {
  const totalContributors = stats.length;
  const totalKloc = stats.reduce((sum, stat) => sum + stat.kloc, 0);
  const totalCommits = stats.reduce((sum, stat) => sum + stat.commits, 0);
  const averageKloc = totalContributors > 0 ? totalKloc / totalContributors : 0;
  const averageCommits = totalContributors > 0 ? totalCommits / totalContributors : 0;
  const topContributor = stats.length > 0 ? stats[0] : null;

  return {
    totalContributors,
    totalKloc,
    totalCommits,
    averageKloc,
    averageCommits,
    topContributor,
    executionTime,
  };
}

/**
 * Sorts contributor stats by KLOC in descending order
 * @param stats - Array of contributor statistics
 * @returns Sorted array
 */
export function sortStatsByKloc(stats: ContributorStats[]): ContributorStats[] {
  return stats.sort((a, b) => b.kloc - a.kloc);
}

/**
 * Filters stats by minimum KLOC threshold
 * @param stats - Array of contributor statistics
 * @param minKloc - Minimum KLOC threshold
 * @returns Filtered array
 */
export function filterStatsByMinKloc(stats: ContributorStats[], minKloc: number): ContributorStats[] {
  return stats.filter(stat => stat.kloc >= minKloc);
}

/**
 * Gets current date in YYYY-MM-DD format
 * @returns Current date string
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Converts seconds to human-readable duration
 * @param seconds - Duration in seconds
 * @returns Human-readable duration string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(2)} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Validates repository path
 * @param repoPath - Path to validate
 * @returns True if path exists and is a git repository
 */
export function validateRepositoryPath(repoPath: string): boolean {
  const fs = require('fs');
  const path = require('path');
  
  if (!fs.existsSync(repoPath)) {
    return false;
  }
  
  if (!fs.existsSync(path.join(repoPath, '.git'))) {
    return false;
  }
  
  return true;
}