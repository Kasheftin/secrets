module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '6.10',
          esmodules: true,
        }
      },
    ],
  ],
}
