const { defineConfig } = require('@vue/cli-service')
const path = require("path");

function resolve(dir) {
  return path.join(__dirname, dir);
}
module.exports = defineConfig({
  transpileDependencies: true,
  chainWebpack: (config) => {
    // 由于我们修改了渲染进程目录，修改'@'的alias
    config.resolve.alias.set("@", resolve("src/renderer"));
  },
  pluginOptions: {
    electronBuilder: {
      mainProcessFile: "src/main/background.js", // 主进程入口文件

      rendererProcessFile: "src/renderer/main.js", // 渲染进程入口文件
      mainProcessWatch: ["src/main"], // 检测主进程文件在更改时将重新编译主进程并重新启动
    },
  },
})
