module.exports = {
  source: ['tokens/**/*.json'],
  platforms: {
    scss: {
      transformGroup: 'scss',
      buildPath: 'src/styles/', // Puts the compiled variables directly into your Angular styles folder
      files: [
        {
          destination: '_tokens.scss',
          format: 'scss/variables'
        }
      ]
    }
  }
};