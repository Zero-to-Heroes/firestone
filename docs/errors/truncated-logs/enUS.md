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
