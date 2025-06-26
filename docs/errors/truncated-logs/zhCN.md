## 严重错误：日志卡住了

请执行以下步骤：

-   关闭 Hearthstone
-   转到 Hearthstone 安装文件夹，其中有 `Hearthstone.exe` 文件
-   检查此文件夹中是否有 `client.config` 文件
-   如果没有，请创建一个
-   用以下内容替换 `client.config` 文件的内容：

```
[Log]
FileSizeLimit.Int=-1
```

-   重新启动 Hearthstone

### 如果这不起作用

卸载/重新安装可能会解决问题：

> 我删除了您提供的 %localappdata%\Blizzard\Hearthstone 地址文件，并删除了《炉石传说》中的所有缓存文件，然后重新安装了游戏，问题就解决了。

你们还有其他可以和《炉石传说》互动的程序吗？一位中国用户说：

> 我发现问题了，我用一个中国特有的启动器启动游戏，然后炉石传说的文件夹关于日志的文件就会消失。不用它启动就不会有问题。
