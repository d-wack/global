export default {
  // Lint + format code; eslint --fix first, then prettier on the result.
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
  // Non-code files just get formatted.
  "*.{json,css,md}": ["prettier --write"],
};
