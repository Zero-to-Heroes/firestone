## Memory Reading Error / Run as admin

The "Memory reading" error occurs when the app doesn't have the rights to access the game client's memory. Usually this is caused by issues with permissions / rights (and so running it as admin usually solves it).

A bit more details on all the steps needed to run as admin:

-   Close HS
-   Close Overwolf
-   Change Firestone and/or Overwolf shortcuts to "run as admin"
    -   Overwolf.exe and OverwolfLauncher.exe should be run as admin
    -   You can also active the "apply to all users" button
-   Restart Overwolf (some users had to restart their full computer)
-   Then you can restart HS
-   If it still doesn't work (even after **a full computer restart**), check if Hearthstone itself is running as admin. If it is, try to run it without admin privileges.

### Other things to try if you have the "Memory reading" error

-   You can also try to run `sfc /scannow` in a command prompt, as this has solved the issue for at least 2 players
-   "Manually ending all processes related to hearthstone, bnet, overwolf, firestone, etc and then relaunching hs and firestone seems to have fixed it. A regular restart of hearthstone and overwolf/firestone via the system tray didn't"
-   One user managed to solve this issue by installing Overwolf in the same subdirectory as Hearthstone (like `D:\Blizzard\HS\Hearthstone` and `D:\Blizzard\HS\Overwolf`), so might be worth a try
