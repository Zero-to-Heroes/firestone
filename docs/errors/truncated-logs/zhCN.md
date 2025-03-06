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
