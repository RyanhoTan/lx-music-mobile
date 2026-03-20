# 项目架构与开发流程

## 项目概览

这是一个基于 React Native 的移动端音乐播放器，导航层使用 `react-native-navigation`，播放器能力基于 `react-native-track-player`。  
从代码组织上看，JS 侧主要由这几层组成：

- 页面层：`src/screens`、`src/components`
- 导航层：`src/navigation`
- 业务层：`src/core`
- 状态层：`src/store`
- 能力层：`src/plugins`、`src/utils`、`src/utils/nativeModules`
- 配置与基础设施：`src/config`、`src/theme`、`src/lang`、`src/types`

需要特别说明一点：虽然项目早期资料会提到 Redux，但当前仓库里的主流模式已经更接近“单例 state + action + hook + 全局事件总线”，不是典型的 Redux Toolkit 写法。

## 启动链路

应用启动主线比较清晰，可以按下面这条链路理解：

```text
index.js
  -> shim.js
  -> src/app.ts
      -> listenLaunchEvent()
      -> 预加载字体大小、窗口尺寸
      -> navigation.init()
          -> registerScreens()
          -> 等待 react-native-navigation 的 app launched
      -> core/init/index.ts
          -> initSetting()
          -> initTheme()
          -> initI18n()
          -> initUserApi()
          -> setApiSource()
          -> registerPlaybackService()
          -> initPlayer()
          -> dataInit()
          -> initCommonState()
          -> initSync()
      -> pushHomeScreen()
```

首页推入后，还会继续做一些延迟动作，例如：

- 首次进入时检查更新
- 初始化 deeplink
- 如果还没同意协议，则弹出协议弹窗

所以如果应用“能启动但页面/功能不对”，通常先看 `src/app.ts` 和 `src/core/init/*`。

## 目录分层

- `src/app.ts`
  应用总入口，负责把初始化、导航注册、首页跳转串起来。

- `src/screens`
  页面级组件。当前核心页面是 `Home`、`PlayDetail`、`SonglistDetail`、`Comment`。

- `src/components`
  通用 UI 组件和跨页面复用组件，例如播放器条、弹窗、输入框、列表组件等。

- `src/navigation`
  原生导航注册、页面跳转、overlay/modal 管理都在这里。

- `src/store`
  全局状态模块。一个模块通常由 `state.ts`、`action.ts`、`hook.ts` 组成。

- `src/core`
  业务编排层，是这个项目最关键的一层。页面大多只是触发动作，真正的业务逻辑多数放在这里。

- `src/utils`
  各种工具方法、文件系统/网络工具、音乐源 SDK、缓存和数据读写辅助。

- `src/plugins`
  对第三方能力再做一层封装，例如播放器、存储、同步。

- `src/config`
  默认配置、配置合并、数据迁移、全局运行时初始化。

- `src/theme` / `src/lang` / `src/types`
  分别对应主题、国际化、类型定义。

- `android` / `ios`
  React Native 原生工程。项目虽然保留了 iOS 工程，但当前自定义原生能力明显以 Android 为主。

- `publish`
  发布脚本和 changelog 处理逻辑。

## 核心运行机制

### 1. 页面与导航

- 顶层导航使用 `react-native-navigation`。
- 真正注册到原生导航里的页面不多，主要是：
  - `Home`
  - `PlayDetail`
  - `SonglistDetail`
  - `Comment`
  - 若干 modal / overlay
- `Home` 页面内部不是继续拆成很多原生页面，而是通过 `navActiveId` 配合 `PagerView` 或条件渲染，在一个页面里切换：
  - 搜索
  - 歌单
  - 榜单
  - 我的列表
  - 设置

这意味着：

- 顶层页面跳转先看 `src/navigation/*`
- Home 内部功能切换先看 `src/screens/Home/*` 和 `src/store/common/*`

### 2. 状态管理方式

`src/store` 的大多数模块都遵循同一套模式：

- `state.ts`
  放模块级单例状态对象

- `action.ts`
  修改状态，并发出对应的 `state_event`

- `hook.ts`
  给 React 组件订阅状态变化使用

主题是个例外：项目用了 `ThemeProvider` + Context 提供主题对象。

开发时有个很重要的约束：

- 不要在组件里直接改 `state.ts` 的对象
- 优先通过 `action.ts` 或 `core` 暴露的业务入口改数据

原因很简单：这个项目很多刷新依赖事件，如果只改值、不发事件，UI 很可能不会更新。

### 3. 全局事件总线

项目大量依赖全局事件总线来解耦，初始化入口在 `src/config/globalData.ts`：

- `global.app_event`
  偏“动作型事件”，表示让别的模块做某件事，例如播放、暂停、切换搜索类型。

- `global.state_event`
  偏“状态变更事件”，表示某个全局状态已经更新。

- `global.list_event`
  专门处理歌单/列表相关操作，负责把内存修改、存储落盘、同步联动串起来。

- `global.dislike_event`
  不喜欢列表相关事件。

可以把它简单理解成：

```text
页面触发 -> core/action -> 修改状态/持久化 -> emit 事件 -> hook/UI 响应
```

### 4. 业务层（core）

`src/core` 是最值得优先阅读的目录，基本可以理解成“应用服务层”：

- `core/init/*`
  应用启动时的初始化和监听器注册。

- `core/player/*`
  播放控制、播放队列、进度、已播列表、稍后播放等。

- `core/music/*`
  统一在线、本地、下载歌曲的 URL、封面、歌词获取接口。

- `core/list.ts`
  我的列表、收藏列表、临时列表等操作入口。

- `core/search/*`、`core/songlist.ts`、`core/leaderboard.ts`
  搜索、歌单、榜单等业务逻辑。

- `core/theme.ts`、`core/version.ts`、`core/sync.ts`、`core/userApi.ts`
  主题、更新、同步、自定义源等横切能力。

整体原则是：页面尽量只负责交互和展示，真正的业务动作放在 `core`。

### 5. 音乐源与数据获取

- 内置在线源在 `src/utils/musicSdk/*`
- 目前按平台拆成多个目录，例如 `kw`、`kg`、`tx`、`wy`、`mg`、`xm`
- `core/music/*` 会把三种来源统一起来：
  - 在线音乐
  - 本地音乐
  - 下载音乐

也就是说：

- 改某个平台接口，优先看 `utils/musicSdk/对应平台`
- 改“播放时怎么拿 URL / 图片 / 歌词”，优先看 `core/music/*`

自定义源相关逻辑主要在：

- `core/apiSource.ts`
- `core/init/userApi/*`
- `src/utils/nativeModules/userApi.ts`

### 6. 播放器链路

播放器是这个项目最完整、也最值得熟悉的一条链路：

1. UI 触发播放，通常先进入 `core/player/player.ts`
2. `core/player` 负责决定播放哪首、下一首怎么选、是否切源、是否写入已播/稍后播放
3. `core/music` 负责拿到真实播放 URL、封面、歌词
4. `plugins/player` 封装 `react-native-track-player`
5. `core/init/player/*` 在启动时注册播放状态、进度、恢复播放、预加载、歌词等监听逻辑
6. 状态和事件再反推回 UI、通知栏、桌面歌词

如果要排查播放问题，建议优先顺着这条链看。

### 7. 列表与持久化

“我的列表”相关逻辑不是在组件里直接改数组，而是走一条固定链路：

1. 页面调用 `core/list.ts`
2. `core/list.ts` 把动作交给 `global.list_event`
3. `event/listEvent.ts` 统一处理内存更新、存储落盘、事件广播
4. `utils/listManage.ts` 维护内存列表缓存
5. `utils/data.ts` + `plugins/storage.ts` 负责真正读写 `AsyncStorage`

这条链路的好处是：

- 列表修改入口统一
- 持久化逻辑集中
- 后续同步功能更容易接入

配置、搜索历史、缓存元数据等其他持久化数据，也大多通过 `utils/data.ts` 统一读写。

### 8. 配置、主题与国际化

- 默认配置：`src/config/defaultSetting.ts`
- 配置合并/迁移：`src/config/setting.ts`
- 运行时设置状态：`src/store/setting/*`
- 主题系统：`src/theme/*`
- 主题初始化：`core/init/theme.ts`
- 国际化资源：`src/lang/*`
- 国际化初始化：`core/init/i18n.ts`

新增一个设置项时，通常至少会动到这些位置：

- `defaultSetting.ts`
- 设置页面 UI
- 对应的 `store` / `core` 消费逻辑

### 9. 原生能力

JS 侧原生桥接封装在 `src/utils/nativeModules/*`，Android 实现主要在：

`android/app/src/main/java/cn/toside/music/mobile/*`

当前比较核心的原生模块有：

- `utils`
  窗口尺寸、通知权限、电池优化、分享等系统能力

- `lyric`
  桌面歌词浮窗能力

- `userApi`
  自定义源脚本运行和通信

- `cache` / `crypto`
  缓存与加解密能力

涉及新原生能力时，建议优先按“JS wrapper -> Android native package -> 页面调用”的顺序看。

## 典型开发流程

### 1. 改页面或交互

- 页面级改动优先去 `src/screens`
- 可复用控件优先去 `src/components`
- 涉及视觉风格时同时看 `src/theme`

### 2. 改业务逻辑

- 先看 `src/core` 里是否已经有对应入口
- 不建议把复杂业务判断直接写进页面组件
- 更推荐页面只做触发，业务逻辑沉到 `core`

### 3. 改全局状态

- 按模块补齐 `state.ts`、`action.ts`、`hook.ts`
- 组件侧通过 hook 订阅
- 修改状态时记得发对应事件

### 4. 改持久化

- 通用 KV 数据优先走 `utils/data.ts`
- 大对象最终落在 `plugins/storage.ts`
- 列表、不喜欢列表这类已有事件总线的模块，不要绕过 `list_event` / `dislike_event` 直接写存储

### 5. 加一个新的独立页面

- 在 `src/screens` 新建页面
- 到 `src/navigation/registerScreens.tsx` 注册
- 到 `src/navigation/navigation.ts` 增加跳转方法
- 需要主题上下文时，默认会被 `Provider` 包起来

### 6. 加 Home 内的新功能视图

- 优先看 `src/screens/Home/Views/*`
- 如果是顶级视图，需要补 `navActiveId` 的切换逻辑
- 如果只是现有视图下的子功能，尽量留在该视图目录内闭环

### 7. 接一个新的音乐源或自定义源能力

- 内置源：`src/utils/musicSdk/新平台`
- 统一接入：`core/music/*`、`core/apiSource.ts`
- 自定义源运行时：`core/init/userApi/*` + `src/utils/nativeModules/userApi.ts`

## 本地开发与验证

常用命令：

- `npm run start`
  启动 Metro

- `npm run dev`
  直接运行 Android

- `npm run ios`
  运行 iOS 工程

- `npm run lint`
  代码检查

- `npm run pack:android`
  打 Android Release 包

建议的验证顺序：

1. 先跑 `npm run lint`
2. 再在 Android 真机或模拟器上走一遍相关链路
3. 如果改动涉及播放、歌词、通知、文件系统、桌面歌词，优先做真机验证

## 建议阅读顺序

如果第一次接手这个项目，建议按下面顺序读：

1. `src/app.ts`
2. `src/core/init/index.ts`
3. `src/navigation/*`
4. `src/screens/Home/*`
5. `src/core/player/*`
6. `src/core/list.ts` + `src/event/listEvent.ts`
7. `src/utils/musicSdk/*`

读完这些，基本就能建立这个项目的主干认知，后面再按具体模块深入即可。
