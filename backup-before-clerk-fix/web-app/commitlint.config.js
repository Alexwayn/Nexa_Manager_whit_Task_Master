module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation changes
        'style',    // Code style changes (formatting, etc.)
        'refactor', // Code refactoring
        'perf',     // Performance improvements
        'test',     // Adding or updating tests
        'build',    // Build system or external dependencies
        'ci',       // CI/CD configuration changes
        'chore',    // Other changes that don't modify src or test files
        'revert',   // Reverting previous commits
        'wip',      // Work in progress
        'improve',  // General improvements
      ],
    ],
    'subject-case': [2, 'never', ['pascal-case', 'upper-case']],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 120],
    'footer-max-line-length': [2, 'always', 120],
  },
}; 