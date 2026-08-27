namespace HackF5.UnitySpy
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Runtime.InteropServices;
    using System.Text;
    using HackF5.UnitySpy.Detail;
    using HackF5.UnitySpy.Util;
    using JetBrains.Annotations;
    using static System.Net.Mime.MediaTypeNames;

    /// <summary>
    /// A factory that creates <see cref="IAssemblyImage"/> instances that provides access into a Unity application's
    /// managed memory.
    /// SEE: https://github.com/Unity-Technologies/mono.
    /// </summary>
    [PublicAPI]
    public static class AssemblyImageFactory
    {
        /// <summary>
        /// Creates an <see cref="IAssemblyImage"/> that provides access into a Unity application's managed memory.
        /// </summary>
        /// <param name="processId">
        /// The id of the Unity process to be inspected.
        /// </param>
        /// <param name="assemblyName">
        /// The name of the assembly to be inspected. The default setting of 'Assembly-CSharp' is probably what you want.
        /// </param>
        /// <returns>
        /// An <see cref="IAssemblyImage"/> that provides access into a Unity application's managed memory.
        /// </returns>
        public static IAssemblyImage Create(int processId, Action<string> Log, string assemblyName = "Assembly-CSharp")
        {
#if NET5_0_OR_GREATER
            // Linux is supported for a Wine/Proton-hosted game: Wine maps the PE images at the
            // addresses the Windows-side pointers refer to, so only the read primitives differ.
            if (!HackF5.UnitySpy.Util.LinuxProcess.IsSupported && (Environment.OSVersion.Platform != PlatformID.Win32NT))
#else
            if (Environment.OSVersion.Platform != PlatformID.Win32NT)
#endif
            {
                throw new InvalidOperationException(
                    "This library reads data directly from a process's memory, so is platform specific "
                    + "and only runs under Windows or Linux (Wine). It might be possible to get it "
                    + "running under macOS, but...");
            }

            var process = new ProcessFacade(processId);
#if NET5_0_OR_GREATER
            Log($"Found process, MainModuleFileName={(HackF5.UnitySpy.Util.LinuxProcess.IsSupported
                ? HackF5.UnitySpy.Util.LinuxProcess.GetMainModuleFileName(processId)
                : process?.Process?.GetMainModuleFileName())}");
#else
            Log($"Found process, MainModuleFileName={process?.Process?.GetMainModuleFileName()}");
#endif
            var monoModule = AssemblyImageFactory.GetMonoModule(process);
            var moduleDump = process.ReadModule(monoModule);
            var rootDomainFunctionAddress = AssemblyImageFactory.GetRootDomainFunctionAddress(moduleDump, monoModule, process.Is64Bits);

            return AssemblyImageFactory.GetAssemblyImage(process, assemblyName, rootDomainFunctionAddress);
        }

        /// <summary>
        /// Diagnostic helper used to discover the correct mono struct offsets against a live process when adding
        /// support for a new Unity/Mono version. It does NOT rely on the (possibly wrong) container offsets - it
        /// scans for them - so it can be used to validate/fix
        /// <see cref="HackF5.UnitySpy.Detail.MonoLibraryOffsets"/>. It is never called by the normal
        /// <see cref="Create(int, Action{string}, string)"/> path, so it has no runtime impact and is intentionally
        /// retained for the next version bump. See docs/BUILDING-OFFSETS.md for the full workflow.
        /// </summary>
        public static void DebugScan(int processId, Action<string> log)
        {
            var process = new ProcessFacade(processId);
            var ptrSize = process.SizeOfPtr;
            log($"Is64Bits={process.Is64Bits} SizeOfPtr={ptrSize}");

            var monoModule = AssemblyImageFactory.GetMonoModule(process);
            var moduleDump = process.ReadModule(monoModule);
            var rootDomainFunctionAddress = AssemblyImageFactory.GetRootDomainFunctionAddress(moduleDump, monoModule, process.Is64Bits);

            IntPtr domain;
            if (process.Is64Bits)
            {
                var off = process.ReadInt32(rootDomainFunctionAddress + 3) + 7;
                domain = process.ReadPtr(rootDomainFunctionAddress + off);
            }
            else
            {
                var domainAddress = process.ReadPtr(rootDomainFunctionAddress + 1);
                domain = process.ReadPtr(domainAddress);
            }

            log($"domain=0x{domain.ToInt64():X}");

            string SafeAscii(IntPtr addr)
            {
                if (addr == Constants.NullPtr)
                {
                    return null;
                }

                try
                {
                    return process.ReadAsciiString(addr, 128);
                }
                catch
                {
                    return null;
                }
            }

            bool Printable(string s) =>
                !string.IsNullOrEmpty(s) && s.Length >= 2 && s.All(c => c >= 0x20 && c < 0x7f);

            // ---- 1. Discover ReferencedAssemblies (domain_assemblies GSList offset in MonoDomain) ----
            int bestRefOff = -1;
            IntPtr assemblyCSharp = Constants.NullPtr;
            for (var off = 8; off <= 1536; off += ptrSize)
            {
                try
                {
                    var head = process.ReadPtr(domain + off);
                    if (head == Constants.NullPtr)
                    {
                        continue;
                    }

                    var names = new List<string>();
                    IntPtr foundAssembly = Constants.NullPtr;
                    var node = head;
                    for (var i = 0; i < 300 && node != Constants.NullPtr; i++)
                    {
                        var data = process.ReadPtr(node);
                        if (data == Constants.NullPtr)
                        {
                            break;
                        }

                        var nm = SafeAscii(process.ReadPtr(data + (ptrSize * 2)));
                        if (Printable(nm))
                        {
                            names.Add(nm);
                            if (nm == "Assembly-CSharp")
                            {
                                foundAssembly = data;
                            }
                        }

                        node = process.ReadPtr(node + ptrSize);
                    }

                    if (foundAssembly != Constants.NullPtr && names.Contains("mscorlib"))
                    {
                        log($"[ReferencedAssemblies] off={off} count={names.Count} sample=[{string.Join(", ", names.Take(8))}]");
                        if (bestRefOff < 0)
                        {
                            bestRefOff = off;
                            assemblyCSharp = foundAssembly;
                        }
                    }
                }
                catch
                {
                    // ignore unreadable offsets
                }
            }

            log($"=> ReferencedAssemblies={bestRefOff}, Assembly-CSharp@0x{assemblyCSharp.ToInt64():X}");
            if (assemblyCSharp == Constants.NullPtr)
            {
                return;
            }

            // ---- 2. Discover AssemblyImage (image ptr offset in MonoAssembly) + ImageClassCache ----
            // We trust AssemblyImage candidates and validate by finding a class cache inside the resulting image.
            foreach (var asmImageOff in new[] { 96, 88, 104, 72, 112, 80 })
            {
                var image = process.ReadPtr(assemblyCSharp + asmImageOff);
                if (image == Constants.NullPtr)
                {
                    continue;
                }

                for (var off = 256; off <= 4096; off += 4)
                {
                    try
                    {
                        var size = process.ReadUInt32(image + off + 24); // HashTableSize candidate
                        if (size < 64 || size > 400000)
                        {
                            continue;
                        }

                        var table = process.ReadPtr(image + off + 32); // HashTableTable candidate
                        if (table == Constants.NullPtr)
                        {
                            continue;
                        }

                        var names = new List<string>();
                        for (uint b = 0; b < size && names.Count < 8; b++)
                        {
                            var def = process.ReadPtr(table + ((int)b * ptrSize));
                            if (def == Constants.NullPtr)
                            {
                                continue;
                            }

                            var nm = SafeAscii(process.ReadPtr(def + 72)); // TypeDefinitionName candidate (x64)
                            if (Printable(nm))
                            {
                                names.Add(nm);
                            }
                        }

                        if (names.Count >= 6)
                        {
                            log($"[ImageClassCache] AssemblyImage={asmImageOff} ImageClassCache={off} size={size} table=0x{table.ToInt64():X} names=[{string.Join(", ", names)}]");
                            DumpClasses(process, log, table, size, ptrSize, SafeAscii, Printable);
                            return;
                        }
                    }
                    catch
                    {
                        // ignore unreadable offsets
                    }
                }
            }

            log("Could not locate ImageClassCache.");
        }

        private static void DumpClasses(
            ProcessFacade process,
            Action<string> log,
            IntPtr table,
            uint size,
            int ptrSize,
            Func<IntPtr, string> safeAscii,
            Func<string, bool> printable)
        {
            // Find a couple of named, non-generic classes and dump their first qwords so trailing
            // MonoClass/MonoClassDef offsets can be pinned by hand.
            var dumped = 0;
            for (uint b = 0; b < size && dumped < 3; b++)
            {
                var def = process.ReadPtr(table + ((int)b * ptrSize));
                if (def == Constants.NullPtr)
                {
                    continue;
                }

                var name = safeAscii(process.ReadPtr(def + 72));
                if (!printable(name) || name.Contains("`") || name.Contains("<"))
                {
                    continue;
                }

                log($"--- class '{name}' @0x{def.ToInt64():X} ---");
                var sb = new StringBuilder();
                for (var q = 0; q < 36; q++)
                {
                    var addr = def + (q * 8);
                    long val;
                    try
                    {
                        val = process.ReadInt64(addr);
                    }
                    catch
                    {
                        break;
                    }

                    // Annotate: looks like a heap/code pointer (large) or a small int / two packed ints.
                    var lo = (int)(val & 0xffffffff);
                    var hi = (int)((val >> 32) & 0xffffffff);
                    var ann = (val > 0x10000 && (val & 0x7) == 0) ? "ptr?" : $"ints({lo},{hi})";
                    log($"  +{q * 8,3} (0x{q * 8:X2}): 0x{val:X16}  {ann}");
                }

                dumped++;
            }
        }

        private static AssemblyImage GetAssemblyImage(ProcessFacade process, string name, IntPtr rootDomainFunctionAddress)
        {

            IntPtr domain;
            if (process.Is64Bits)
            {
                // Offsets taken by decompiling the 64 bits version of mono-2.0-bdwgc.dll
                //
                // mov rax, [rip + 0x46ad39]
                // ret
                //
                // These two lines in Hex translate to
                // 488B05 39AD46 00
                // C3
                // 
                // So wee need to offset the first three bytes to get to the relative offset we need to add to rip
                // rootDomainFunctionAddress + 3
                //
                // rip has the current value of the rootDoaminAddress plus the 7 bytes of the first instruction (mov rax, [rip + 0x46ad39])
                // then we need to add this offsets to get the domain starting address
                var offset = process.ReadInt32(rootDomainFunctionAddress + 3) + 7;
                //// pointer to struct of type _MonoDomain
                domain = process.ReadPtr(rootDomainFunctionAddress + offset);
            } 
            else
            {
                var domainAddress = process.ReadPtr(rootDomainFunctionAddress + 1);
                //// pointer to struct of type _MonoDomain
                domain = process.ReadPtr(domainAddress);
            }

            //// pointer to array of structs of type _MonoAssembly
            var assemblyArrayAddress = process.ReadPtr(domain + process.MonoLibraryOffsets.ReferencedAssemblies);
            for (var assemblyAddress = assemblyArrayAddress;
                assemblyAddress != Constants.NullPtr;
                assemblyAddress = process.ReadPtr(assemblyAddress + process.SizeOfPtr))
            {
                var assembly = process.ReadPtr(assemblyAddress);
                var assemblyNameAddress = process.ReadPtr(assembly + (process.SizeOfPtr * 2));
                var assemblyName = process.ReadAsciiString(assemblyNameAddress);
                if (assemblyName == name)
                {
                    var assemblyImagePtr = process.ReadPtr(assembly + process.MonoLibraryOffsets.AssemblyImage);
                    return new AssemblyImage(process, assemblyImagePtr);
                }
            }

            throw new InvalidOperationException($"Unable to find assembly '{name}'");
        }

        // https://stackoverflow.com/questions/36431220/getting-a-list-of-dlls-currently-loaded-in-a-process-c-sharp
        // TODO add check for matching platforms and implement the following code while keeping the existing one otherwise:
        // This can be done with this if the process is running in 64 bits mode (and UnitySpy too of course)
        // foreach(ProcessModule module in process.Process.Modules) {
        //    if(module.ModuleName == "mono-2.0-bdwgc.dll") {
        //        return new ModuleInfo(module.ModuleName, module.BaseAddress, module.ModuleMemorySize);
        //    }            
        private static ModuleInfo GetMonoModule(ProcessFacade process)
        {
#if NET5_0_OR_GREATER
            if (HackF5.UnitySpy.Util.LinuxProcess.IsSupported)
            {
                // Wine maps each PE section separately with its real file path, so /proc/pid/maps
                // yields the same module list psapi would report.
                return HackF5.UnitySpy.Util.LinuxProcess.GetModules(process.Process.Id)
                    .FirstOrDefault(module => module.ModuleName == "mono-2.0-bdwgc.dll");
            }
#endif
            var modulePointers = Native.GetProcessModulePointers(process);

            // Collect modules from the process
            var modules = new List<ModuleInfo>();
            foreach (var modulePointer in modulePointers)
            {
                var moduleFilePath = new StringBuilder(1024);
                var errorCode = Native.GetModuleFileNameEx(
                    process.Process.Handle,
                    modulePointer,
                    moduleFilePath,
                    (uint)moduleFilePath.Capacity);

                if (errorCode == 0)
                {
                    throw new COMException("Failed to get module file name.", Marshal.GetLastWin32Error());
                }

                var moduleName = Path.GetFileName(moduleFilePath.ToString());
                Native.GetModuleInformation(
                    process.Process.Handle,
                    modulePointer,
                    out var moduleInformation,
                    (uint)(IntPtr.Size * modulePointers.Length));

                // Convert to a normalized module and add it to our list
                var module = new ModuleInfo(moduleName, moduleInformation.BaseOfDll, moduleInformation.SizeInBytes);
                modules.Add(module);
            }

            return modules.FirstOrDefault(module => module.ModuleName == "mono-2.0-bdwgc.dll");
        }

        private static IntPtr GetRootDomainFunctionAddress(byte[] moduleDump, ModuleInfo monoModuleInfo, bool is64Bits)
        {
            // offsets taken from https://docs.microsoft.com/en-us/windows/desktop/Debug/pe-format
            // ReSharper disable once CommentTypo
            var startIndex = moduleDump.ToInt32(PEFormatOffsets.Signature); // lfanew

            var exportDirectoryIndex = startIndex + PEFormatOffsets.GetExportDirectoryIndex(is64Bits);
            var exportDirectory = moduleDump.ToInt32(exportDirectoryIndex);

            var numberOfFunctions = moduleDump.ToInt32(exportDirectory + PEFormatOffsets.NumberOfFunctions);
            var functionAddressArrayIndex = moduleDump.ToInt32(exportDirectory + PEFormatOffsets.FunctionAddressArrayIndex);
            var functionNameArrayIndex = moduleDump.ToInt32(exportDirectory + PEFormatOffsets.FunctionNameArrayIndex);

            var rootDomainFunctionAddress = Constants.NullPtr;
            for (var functionIndex = 0;
                functionIndex < (numberOfFunctions * PEFormatOffsets.FunctionEntrySize);
                functionIndex += PEFormatOffsets.FunctionEntrySize)
            {
                var functionNameIndex = moduleDump.ToInt32(functionNameArrayIndex + functionIndex);
                var functionName = moduleDump.ToAsciiString(functionNameIndex);
                if (functionName == "mono_get_root_domain")
                {
                    rootDomainFunctionAddress = monoModuleInfo.BaseAddress
                        + moduleDump.ToInt32(functionAddressArrayIndex + functionIndex);

                    break;
                }
            }

            if (rootDomainFunctionAddress == Constants.NullPtr)
            {
                throw new InvalidOperationException("Failed to find mono_get_root_domain function.");
            }

            return rootDomainFunctionAddress;
        }
    }
}