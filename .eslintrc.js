module.exports = {
  extends: 'airbnb-base',
  env: {
    browser: true,
  },
  rules: {
    'import/no-amd': 0,
    'import/no-dynamic-require': 0,
    'max-len': 0,
    'no-console': 0,
    'no-param-reassign': 0,
    'no-unused-vars': 0,
    'import/extensions': 0,
    'import/no-unresolved': 0,
    'guard-for-in': 0,
    'no-continue': 0,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
  },
};
