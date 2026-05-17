# Flora's Space — 个人简历网站

一个带身份验证（HR / 访客双模式）的个人简历网站，所有个人信息通过配置文件注入，源码公开但隐私安全。

## 快速开始

```bash
# 1. 克隆仓库
git clone <your-repo-url>
cd <repo-name>

# 2. 创建个人配置
cp config.example.js config.js

# 3. 编辑 config.js，填入你的真实信息

# 4. 用浏览器打开 index.html
```

## 隐私设计

| 文件 | 内容 | 是否提交 |
|------|------|:--:|
| `config.example.js` | 占位模板（张三、13800000000） | 是 |
| `config.js` | 你的真实信息 | 否（gitignore） |
| `index.html` | 页面骨架，不含任何真实数据 | 是 |

所有姓名、手机号、邮箱、微信、学校等信息存放在 `config.js` 中，通过 JavaScript 动态填充到 DOM。GitHub 上只能看到空的 `<span data-config="name">` 占位符。

## 功能

- 8 个板块：首页、关于我、教育背景、技能专长、工作经历、项目经历、校园经历、留言板
- HR / 访客双模式身份验证
- CSS Custom Properties 设计令牌体系
- F 型布局（左侧导航栏 + 右侧滚动内容）
- 响应式适配（手机 / 平板 / 桌面）
- 网格点阵背景 + CSS 动画
- 留言板粒子特效

## 技术栈

纯原生，零外部依赖：

- HTML5 / CSS3（Flexbox、Grid、Custom Properties、动画）
- JavaScript ES6+（DOM 操作、Intersection Observer、页面切换）
- 设计系统：oklch 色彩空间

## 部署

拖拽整个文件夹到 [Netlify](https://app.netlify.com/drop) 即可上线。
