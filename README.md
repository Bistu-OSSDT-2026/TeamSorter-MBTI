# TeamSorter-MBTI

> 基于 MBTI 人格类型与 WCPA 能力模型的团队人员智能匹配系统

## ✨ 功能特性

### 🧠 MBTI 人格测试
- 支持完整的 16 种 MBTI 人格类型测试
- 详细的人格类型描述、优势分析和发展建议
- 测试结果自动保存与管理

### 🎯 WCPA 8维能力测评
- **创新能力** - 创造性思维与问题解决能力
- **逻辑思维** - 分析推理与判断能力
- **沟通表达** - 信息传递与说服能力
- **团队协作** - 合作共事与协同能力
- **领导力** - 组织协调与决策能力
- **执行力** - 任务推进与完成能力
- **学习能力** - 知识获取与应用能力
- **抗压能力** - 压力应对与心理调适能力
- 可视化能力雷达图展示

### 🔗 岗位匹配评估
- 16 种人格类型与岗位的智能匹配
- 自定义个人能力得分与岗位要求阈值
- 综合匹配度计算与可视化展示

### 📋 任务匹配模块
- 基于 MBTI 类型和能力维度的人员任务智能分配
- 支持多人同时匹配，自动计算匹配度
- 匹配结果导入个人档案功能

## 🛠️ 技术栈

| 分类 | 技术 |
|------|------|
| 前端框架 | Vue 3 + Vue Router 4 |
| UI 组件库 | Element Plus |
| 图表库 | ECharts + vue-echarts |
| 后端框架 | Node.js + Express 5 |
| 数据存储 | 内存数据库 (store.js) |
| 构建工具 | Vue CLI 5 |

## 📁 项目结构

```
TeamSorter-MBTI/
├── public/                 # 静态资源
├── server/                 # 后端服务
│   ├── data/               # 测试数据文件
│   ├── models/             # 数据模型
│   ├── routes/             # API 路由
│   │   └── mbtiRoutes.js   # MBTI 相关 API
│   ├── store.js            # 内存数据库
│   ├── index.js            # 服务入口
│   └── package.json        # 后端依赖
├── src/                    # 前端代码
│   ├── assets/             # 静态资源
│   ├── router/             # 路由配置
│   ├── views/              # 页面组件
│   │   ├── MbtiPage.vue    # MBTI 主页面
│   │   ├── MbtiTest.vue    # MBTI 测试
│   │   ├── WcpaTest.vue    # WCPA 能力测评
│   │   └── TaskMatch.vue   # 任务匹配
│   ├── App.vue             # 根组件
│   └── main.js             # 入口文件
├── start.bat               # Windows 启动脚本
├── package.json            # 前端依赖
└── vue.config.js           # Vue CLI 配置
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install
```

### 启动开发服务器

```bash
# 方式一：分别启动（推荐）
# 终端1 - 启动后端服务
cd server && node index.js

# 终端2 - 启动前端服务
npm run serve

也可以在根目录尝 试同时启动：

```bash
npm run dev
```

### 3. 默认访问地址

- 前端：`http://localhost:8080`
- 后端：`http://localhost:5000`

### 4.标准启动步骤
1. 确认安装Node.js，环境验证通过

2. 将项目解压至纯英文无空格路径

3. 根目录CMD执行依赖安装：npm install

4. 双击 start.bat 自动开启后端服务与前端开发服务


## 协作约定

本项目按照课程建议流程进行协作：

1. 使用 Issue 拆分功能、Bug、测试和文档任务
2. 成员认领任务后创建独立分支开发
3. 开发完成后提交 Pull Request
4. 由其他成员进行 Review、验证和合并
5. 在课程后期集中修复问题并发布版本

更详细的协作说明见 `CONTRIBUTING.md`。

## 当前版本范围

本版本重点保证核心流程可运行，不追求大而全。以下内容暂不作为当前版本重点：

- 用户登录与权限管理
- 云端数据库与多用户实时协作
- 完整后台管理系统
- 大规模部署与生产环境优化

## 课程目标对应

本仓库不仅用于展示功能结果，也用于体现开源协作过程，包括：

- 公开仓库管理
- README 与许可证配置
- Issue 驱动开发
- Pull Request 协作与代码检查
- Bug 修复与版本发布

## License

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
