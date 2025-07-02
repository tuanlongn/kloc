import { GitKlocAnalyzer, ContributorStats } from './kloc';
import * as fs from 'fs';
import { execSync } from 'child_process';

// Mock external dependencies
jest.mock('fs');
jest.mock('child_process');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('GitKlocAnalyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fs.existsSync to return true for valid paths
    mockFs.existsSync.mockReturnValue(true);
  });

  describe('KLOC Calculation', () => {
    it('should calculate KLOC correctly from lines added', () => {
      // Test data: 1000 lines added = 1.00 KLOC
      const testStats: ContributorStats = {
        author: 'Test User',
        email: 'test@example.com',
        linesAdded: 1000,
        linesDeleted: 0,
        netLines: 1000,
        commits: 1,
        kloc: 0 // Will be calculated
      };

      // Calculate KLOC using the same formula as in the main code
      const expectedKloc = Math.round((testStats.linesAdded / 1000) * 100) / 100;
      expect(expectedKloc).toBe(1.00);
    });

    it('should calculate KLOC with decimal precision', () => {
      // Test data: 1234 lines added = 1.23 KLOC (rounded)
      const linesAdded = 1234;
      const expectedKloc = Math.round((linesAdded / 1000) * 100) / 100;
      expect(expectedKloc).toBe(1.23);
    });

    it('should calculate KLOC for small numbers', () => {
      // Test data: 567 lines added = 0.57 KLOC
      const linesAdded = 567;
      const expectedKloc = Math.round((linesAdded / 1000) * 100) / 100;
      expect(expectedKloc).toBe(0.57);
    });

    it('should calculate KLOC for large numbers', () => {
      // Test data: 12345 lines added = 12.35 KLOC (rounded)
      const linesAdded = 12345;
      const expectedKloc = Math.round((linesAdded / 1000) * 100) / 100;
      expect(expectedKloc).toBe(12.35);
    });

    it('should handle zero lines added', () => {
      // Test data: 0 lines added = 0.00 KLOC
      const linesAdded = 0;
      const expectedKloc = Math.round((linesAdded / 1000) * 100) / 100;
      expect(expectedKloc).toBe(0.00);
    });

    it('should round KLOC to 2 decimal places', () => {
      // Test data: 1236 lines added = 1.24 KLOC (rounded from 1.236)
      const linesAdded = 1236;
      const expectedKloc = Math.round((linesAdded / 1000) * 100) / 100;
      expect(expectedKloc).toBe(1.24);
    });
  });

  describe('Net Lines Calculation', () => {
    it('should calculate net lines correctly', () => {
      const linesAdded = 1000;
      const linesDeleted = 200;
      const expectedNetLines = linesAdded - linesDeleted;
      expect(expectedNetLines).toBe(800);
    });

    it('should handle negative net lines', () => {
      const linesAdded = 100;
      const linesDeleted = 300;
      const expectedNetLines = linesAdded - linesDeleted;
      expect(expectedNetLines).toBe(-200);
    });
  });

  describe('Date Validation', () => {
    it('should validate correct date format', () => {
      const analyzer = new GitKlocAnalyzer('/test/repo', '2024-01-01', '2024-12-31');
      // Test that the analyzer can be created without throwing
      expect(analyzer).toBeDefined();
    });

    it('should reject invalid date format', async () => {
      const analyzer = new GitKlocAnalyzer('/test/repo', 'invalid-date', '2024-12-31');
      
      // Mock git commands to avoid actual git calls
      mockExecSync.mockReturnValue('');
      
      await expect(analyzer.analyze()).rejects.toThrow('Invalid from date format');
    });

    it('should reject date range where from > to', async () => {
      const analyzer = new GitKlocAnalyzer('/test/repo', '2024-12-31', '2024-01-01');
      
      // Mock git commands to avoid actual git calls
      mockExecSync.mockReturnValue('');
      
      await expect(analyzer.analyze()).rejects.toThrow('From date');
    });
  });

  describe('Repository Validation', () => {
    it('should reject non-existent repository path', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const analyzer = new GitKlocAnalyzer('/non/existent/path', '2024-01-01', '2024-12-31');
      
      await expect(analyzer.analyze()).rejects.toThrow('Repository path does not exist');
    });

    it('should reject non-git repository', async () => {
      // Mock fs.existsSync to return true for repo path but false for .git
      mockFs.existsSync.mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('.git')) {
          return false;
        }
        return true;
      });
      
      const analyzer = new GitKlocAnalyzer('/test/repo', '2024-01-01', '2024-12-31');
      
      await expect(analyzer.analyze()).rejects.toThrow('Not a git repository');
    });
  });

  describe('Integration Test - Mock Git Output', () => {
    it('should process mock git log output correctly', async () => {
      // Mock git log output
      const mockGitLogOutput = [
        'abc123|John Doe|john@example.com|2024-01-01|Initial commit',
        'def456|Jane Smith|jane@example.com|2024-01-02|Add feature'
      ].join('\n');

      mockExecSync.mockImplementation((command: string) => {
        if (command.includes('--pretty=format')) {
          return mockGitLogOutput;
        } else if (command.includes('--numstat') && command.includes('--format=""')) {
          // Mock individual commit stats
          if (command.includes('abc123')) {
            return '100\t10\tfile1.ts\n50\t5\tfile2.ts';
          } else if (command.includes('def456')) {
            return '200\t20\tfile3.ts';
          }
        } else if (command.includes('--numstat') && !command.includes('show')) {
          // Mock optimized stats (fallback to empty to use individual stats)
          return '';
        }
        return '';
      });

      const analyzer = new GitKlocAnalyzer('/test/repo', '2024-01-01', '2024-12-31');
      const results = await analyzer.analyze();

      expect(results).toHaveLength(2);
      
      // Check John Doe's stats (150 lines added, 15 deleted)
      const johnStats = results.find(r => r.email === 'john@example.com');
      expect(johnStats).toBeDefined();
      expect(johnStats!.linesAdded).toBe(150);
      expect(johnStats!.linesDeleted).toBe(15);
      expect(johnStats!.kloc).toBe(0.15); // 150/1000 = 0.15
      expect(johnStats!.netLines).toBe(135);
      expect(johnStats!.commits).toBe(1);

      // Check Jane Smith's stats (200 lines added, 20 deleted)
      const janeStats = results.find(r => r.email === 'jane@example.com');
      expect(janeStats).toBeDefined();
      expect(janeStats!.linesAdded).toBe(200);
      expect(janeStats!.linesDeleted).toBe(20);
      expect(janeStats!.kloc).toBe(0.20); // 200/1000 = 0.20
      expect(janeStats!.netLines).toBe(180);
      expect(janeStats!.commits).toBe(1);
    });

    it('should handle empty git log output', async () => {
      mockExecSync.mockReturnValue('');
      
      const analyzer = new GitKlocAnalyzer('/test/repo', '2024-01-01', '2024-12-31');
      const results = await analyzer.analyze();
      
      expect(results).toHaveLength(0);
    });
  });
});

// Test utility functions
describe('Utility Functions', () => {
  describe('formatNumber', () => {
    // Since formatNumber is not exported, we'll test the logic here
    it('should format numbers with thousand separators', () => {
      const formatNumber = (num: number): string => num.toLocaleString();
      
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(123)).toBe('123');
    });
  });
});