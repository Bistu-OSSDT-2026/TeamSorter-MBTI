# TeamSorter-MBTI

一个面向课程实践的小型开源项目，用于完成 MBTI 人格测试、WCPA 能力测评、人格档案记录与岗位匹配分析。

## 项目简介

本项目服务于学生实验课场景，目标是在有限课时内完成一个可运行、可协作、可发布的小型开源软件。当前版本聚焦于以下核心流程：

1. 用户进入系统并完成 MBTI 人格测试
2. 用户查看人格类型、档案记录和岗位匹配结果
3. 用户完成 WCPA 测评并查看能力相关数据
4. 后端提供数据存储、问卷导入和统计接口

## 当前版本功能

- MBTI 人格测试与类型展示
- WCPA 测评页面
- 人格档案记录的新增、查询、修改、删除
- MBTI 类型数据初始化与岗位匹配
- 问卷 Excel 数据导入
- 测评统计数据接口

## 技术栈

- 前端：Vue 3、Vue Router、Element Plus
- 后端：Node.js、Express
- 数据存储：基于 JSON 文件的轻量存储
- 数据处理：XLSX

## 项目结构

```text
test1/
|-- src/               # 前端源码
|   |-- views/         # 页面视图
|   |-- router/        # 前端路由
|   `-- assets/        # 静态资源与课程说明材料
|-- public/            # 静态公开资源
|-- server/            # 后端服务
|   |-- routes/        # API 路由
|   |-- data/          # JSON 数据文件
|   |-- models/        # 数据模型
|   `-- uploads/       # 导入文件
|-- vue.config.js      # 前端开发配置
`-- package.json       # 前端脚本与依赖
```

## 运行方式

### 1. 安装依赖

前端根目录：

```bash
npm install
```

后端目录：

```bash
cd server
npm install
```

### 2. 启动项目

启动后端：

```bash
cd server
npm start
```

启动前端：

```bash
npm run serve
```

也可以在根目录尝试同时启动：

```bash
npm run dev
```

### 3. 默认访问地址

- 前端：`http://localhost:8080`
- 后端：`http://localhost:5000`

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

本项目采用 `MIT License`，详见 `LICENSE`。
