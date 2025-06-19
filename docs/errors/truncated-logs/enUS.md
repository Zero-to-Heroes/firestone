## CRITICAL ERROR: Logs are stuck

Do the following steps:

-   Close Hearthstone
-   Go to your Hearthstone install folder, where the `Hearthstone.exe` file is located
-   Check if there is a `client.config` file in this folder
    -   If there isn't, create one
-   Replace the contents of the `client.config` file by this:

```
[Log]
FileSizeLimit.Int=-1
```

-   Restart Hearthstone

### If this doesn't work

Do you have another program that interacts with Hearthstone? From a Chinese user:

> 我发现问题了，我用一个中国特有的启动器启动游戏，然后炉石传说的文件夹关于日志的文件就会消失。不用它启动就不会有问题。
