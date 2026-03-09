const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    devtool: 'source-map'   // ← 完整映射
  }
})
module.exports = {
  devServer: {
    proxy: {
      "/deepseek": {
        target: "https://api.deepseek.com",
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          "^/deepseek": "",
        },
      },
    },
  },
};