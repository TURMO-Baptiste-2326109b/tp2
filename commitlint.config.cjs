module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      issuePrefixes: ['#'],
    },
  },
  rules: {
    'subject-case': [2, 'always', ['lower-case']],
    'scope-enum': [1, 'always', ['wip', 'configs', 'formatting', 'code', 'ci' ,'deployment', 'tests']],
    'body-max-line-length': [1, 'always', 100],
  },
};