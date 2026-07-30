This project is a port of [UnitySpy](https://github.com/hackf5/unityspy) to the .NET 4.5 framework version and adds a Hearthstone-specific layer.

https://medium.com/@hackf5/hacking-into-unity-games-ca99f87954c
https://discord.gg/myk6Zn8rnY

# Supporting new Unity versions

UnitySpy supports a few versions of Unity out of the box (2018.4, 2019.4, 2021.3). If you want to use on a version that is not supported, you will probably need to update the lib.
Most likely, you will only need to update the MonoLibraryOffsets class.

## What are offsets? Why do we need to update them?

See https://medium.com/@hackf5/hacking-into-unity-games-ca99f87954c for a better explanation.

In short, in order to parse the Mono structure, UnitySpy reads the info it needs by accessing the memory by its direct address in memory. Or, more specifically, its address relative to the start of the current structure. The offsets are these relative addresses.
the rough steps are:
- Figure out which version of Mono corresponds to your Unity version. This will let you get the Mono source code, which is very very helpful to figure out what you're looking at
- Get a hex editor, and open the process memory in the hex editor
- Then go from the root_domain address (if you're able to open it, it most likely means that it's correct). 
- Then go iteratively, trying to get each field one after the other, using the Mono source code to have a rough idea of what offset is who what field, but keeping an eye on the hex structure, because sometimes there is not an exact match (because of padding, for instance)
