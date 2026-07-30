// ReSharper disable IdentifierTypo
namespace HackF5.UnitySpy.Detail
{
    using HackF5.UnitySpy.Offsets;
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;

    public class MonoLibraryOffsets
    {
        public static readonly MonoLibraryOffsets Unity2018_4_10_x86_PE_Offsets = new MonoLibraryOffsets
        {
            UnityVersion = "2018.4.10",
            Is64Bits = false,
            Format = BinaryFormat.PE,

            AssemblyImage = 0x44,
            ReferencedAssemblies = 0x6c,
            ImageClassCache = 0x354,
            HashTableSize = 0xc,
            HashTableTable = 0x14,
            
            TypeDefinitionFieldSize = 0x10,
            TypeDefinitionBitFields = 0x14,
            TypeDefinitionClassKind = 0x1e,
            TypeDefinitionParent = 0x20,
            TypeDefinitionNestedIn = 0x24,
            TypeDefinitionName = 0x2c,
            TypeDefinitionNamespace = 0x30,
            TypeDefinitionVTableSize = 0x38,
            TypeDefinitionSize = 0x5c,
            TypeDefinitionFields = 0x60,
            TypeDefinitionByValArg = 0x74,
            TypeDefinitionRuntimeInfo = 0x84,

            TypeDefinitionFieldCount = 0xa4,
            TypeDefinitionNextClassCache = 0xa8,

            TypeDefinitionGenericContainer = 0xac,
            TypeDefinitionMonoGenericClass = 0x94,

            TypeDefinitionRuntimeInfoDomainVtables = 0x4,

            VTable = 0x28,

            UnicodeString = 0xc,
        };

        public static readonly MonoLibraryOffsets Unity2019_4_2020_3_x64_PE_Offsets = new MonoLibraryOffsets
        {
            UnityVersion = "2019.4.5",
            Is64Bits = true,
            Format = BinaryFormat.PE,

            AssemblyImage = 0x44 + 0x1c,
            ReferencedAssemblies = 0x6c + 0x5c,
            ImageClassCache = 0x354 + 0x16c,
            HashTableSize = 0xc + 0xc,
            HashTableTable = 0x14 + 0xc,

            TypeDefinitionFieldSize = 0x10 + 0x10,
            TypeDefinitionBitFields = 0x14 + 0xc,
            TypeDefinitionClassKind = 0x1e + 0xc,
            TypeDefinitionParent = 0x20 + 0x10,                         // 0x30
            TypeDefinitionNestedIn = 0x24 + 0x14,                       // 0x38
            TypeDefinitionName = 0x2c + 0x1c,                           // 0x48
            TypeDefinitionNamespace = 0x30 + 0x20,                      // 0x50
            TypeDefinitionVTableSize = 0x38 + 0x24,
            TypeDefinitionSize = 0x5c + 0x20 + 0x18 - 0x4,              // 0x90 Array Element Count
            TypeDefinitionFields = 0x60 + 0x20 + 0x18,                  // 0x98
            TypeDefinitionByValArg = 0x74 + 0x44,
            TypeDefinitionRuntimeInfo = 0x84 + 0x34 + 0x18,             // 0xD0

            TypeDefinitionFieldCount = 0xa4 + 0x34 + 0x10 + 0x18,
            TypeDefinitionNextClassCache = 0xa8 + 0x34 + 0x10 + 0x18 + 0x4,

            TypeDefinitionMonoGenericClass = 0x94 + 0x34 + 0x18 + 0x10,
            TypeDefinitionGenericContainer = 0x110,

            TypeDefinitionRuntimeInfoDomainVtables = 0x4 + 0x4,

            VTable = 0x28 + 0x18,

            UnicodeString = 0x14,
        };

        public static readonly MonoLibraryOffsets Unity2021_3_19_x86_PE_Offsets = new MonoLibraryOffsets
        {
            UnityVersion = "2021.3.19",
            Is64Bits = false,
            Format = BinaryFormat.PE,

            ReferencedAssemblies = 88,
            AssemblyImage = 72,

            ImageClassCache = 860, // 848 + 4 + 4, //848 is where the *assembly is found // 0x354,
            HashTableSize = 12, //0xc,
            HashTableTable = 20, //0x14,


            TypeDefinitionClassKind = 15,
            TypeDefinitionFieldSize = 16,
            TypeDefinitionBitFields = 20,
            TypeDefinitionParent = 32,
            TypeDefinitionNestedIn = 36,
            TypeDefinitionName = 44,
            TypeDefinitionNamespace = 48,
            TypeDefinitionVTableSize = 56,
            TypeDefinitionSize = 92,
            TypeDefinitionFields = 96,
            TypeDefinitionByValArg = 112,
            TypeDefinitionRuntimeInfo = 124,

            TypeDefinitionFieldCount = 156,

            TypeDefinitionNextClassCache = 160,

            TypeDefinitionMonoGenericClass = 140, // 0x94,
            TypeDefinitionGenericContainer = 164, // 0xac,

            TypeDefinitionRuntimeInfoDomainVtables = 4,

            VTable = 44,

            UnicodeString = 0xc,
        };

        // Same as 2021.3.19
        public static readonly MonoLibraryOffsets Unity2022_3_62_x86_PE_Offsets = new MonoLibraryOffsets
        {
            UnityVersion = "2022.3.62",
            Is64Bits = false,
            Format = BinaryFormat.PE,

            ReferencedAssemblies = 88,
            AssemblyImage = 72,

            ImageClassCache = 860, // 848 + 4 + 4, //848 is where the *assembly is found // 0x354,
            HashTableSize = 12, //0xc,
            HashTableTable = 20, //0x14,


            TypeDefinitionClassKind = 15,
            TypeDefinitionFieldSize = 16,
            TypeDefinitionBitFields = 20,
            TypeDefinitionParent = 32,
            TypeDefinitionNestedIn = 36,
            TypeDefinitionName = 44,
            TypeDefinitionNamespace = 48,
            TypeDefinitionVTableSize = 56,
            TypeDefinitionSize = 92,
            TypeDefinitionFields = 96,
            TypeDefinitionByValArg = 112,
            TypeDefinitionRuntimeInfo = 124,

            TypeDefinitionFieldCount = 156,

            TypeDefinitionNextClassCache = 160,

            TypeDefinitionMonoGenericClass = 140, // 0x94,
            TypeDefinitionGenericContainer = 164, // 0xac,

            TypeDefinitionRuntimeInfoDomainVtables = 4,

            VTable = 44,

            UnicodeString = 0xc,
        };

        // x64 port of Unity2022_3_62_x86_PE_Offsets (same Unity/mono, just 64-bit).
        // Comments show "x86base + delta" where delta accounts for pointer growth (4 -> 8) and 8-byte alignment.
        public static readonly MonoLibraryOffsets Unity2022_3_62_x64_PE_Offsets = new MonoLibraryOffsets
        {
            UnityVersion = "2022.3.62",
            Is64Bits = true,
            Format = BinaryFormat.PE,

            // Tier B - container-relative offsets, discovered against the live x64 process (see DebugScan).
            ReferencedAssemblies = 160,   // domain_assemblies offset in MonoDomain (x86 was 88)
            AssemblyImage = 96,           // x86 72 (0x48) -> 0x60; cross-checked vs Unity2019_4_2020_3 x64 set

            ImageClassCache = 1232,       // class_cache offset in MonoImage (x86 was 860)
            HashTableSize = 24,           // x86 12 (0xc) -> 0x18; 3 leading function pointers double
            HashTableTable = 32,          // x86 20 (0x14) -> 0x20

            // Tier A - MonoClass / MonoClassDef / MonoClassGtd / MonoVTable layout.
            TypeDefinitionClassKind = 27,         // x86 15 - class_kind byte after idepth(u16)+rank(u8)
            TypeDefinitionFieldSize = 32,         // x86 16 - sizeof(MonoClassField): 3 ptr + int -> 28 aligned to 32
            TypeDefinitionBitFields = 32,         // x86 20 (0x14) -> 0x20; matches Unity2019_4_2020_3 x64 set
            TypeDefinitionParent = 48,            // x86 32 (0x20) -> 0x30; matches x64 set
            TypeDefinitionNestedIn = 56,          // x86 36 (0x24) -> 0x38; matches x64 set
            TypeDefinitionName = 72,              // x86 44 (0x2c) -> 0x48; matches x64 set
            TypeDefinitionNamespace = 80,         // x86 48 (0x30) -> 0x50; matches x64 set
            TypeDefinitionVTableSize = 92,        // x86 56 (0x38) -> 0x5c; matches x64 set
            TypeDefinitionSize = 144,             // x86 92 - confirmed live (sizes union; element_size=24 for Entry[])
            TypeDefinitionFields = 152,           // x86 96 - confirmed live (MonoClassField* array)
            TypeDefinitionByValArg = 184,         // x86 112 - confirmed live (embedded MonoType)
            TypeDefinitionRuntimeInfo = 208,      // x86 124 - confirmed live

            TypeDefinitionFieldCount = 256,       // x86 156 (MonoClassDef) - confirmed live (common end 240 + 16)
            TypeDefinitionNextClassCache = 264,   // x86 160 (MonoClassDef) - confirmed live (8-aligned ptr)

            TypeDefinitionMonoGenericClass = 240, // x86 140 - confirmed live (== sizeof common MonoClass)
            TypeDefinitionGenericContainer = 272, // x86 164 (MonoClassGtd) - confirmed live (== sizeof MonoClassDef)

            TypeDefinitionRuntimeInfoDomainVtables = 8, // x86 4 - max_domain(u16)+pad, ptr array 8-aligned

            VTable = 72,                          // x86 44 - MonoVTable vtable[] start (validated via static field read)

            UnicodeString = 20,                   // x86 12 (0xc) -> 0x14; MonoString header 8+8, length(4), chars at 20
        };

        private static readonly List<MonoLibraryOffsets> SupportedVersions = new List<MonoLibraryOffsets>()
        {
            //Unity2018_4_10_x86_PE_Offsets ,
            //Unity2019_4_2020_3_x64_PE_Offsets,
            //Unity2021_3_19_x86_PE_Offsets,
            Unity2022_3_62_x86_PE_Offsets,
            Unity2022_3_62_x64_PE_Offsets,
        };

        public string UnityVersion { get; private set; }

        public bool Is64Bits { get; private set; }

        public BinaryFormat Format { get; private set; }

        public int AssemblyImage { get; private set; }

        public int ReferencedAssemblies { get; private set; }

        public int ImageClassCache { get; private set; }

        public int HashTableSize { get; private set; }

        public int HashTableTable { get; private set; }


        // MonoClass Offsets

        public int TypeDefinitionFieldSize { get; private set; }

        public int TypeDefinitionBitFields { get; private set; }

        public int TypeDefinitionClassKind { get; private set; }

        public int TypeDefinitionParent { get; private set; }

        public int TypeDefinitionNestedIn { get; private set; }

        public int TypeDefinitionName { get; private set; }

        public int TypeDefinitionNamespace { get; private set; }

        public int TypeDefinitionVTableSize { get; private set; }

        public int TypeDefinitionSize { get; private set; }

        public int TypeDefinitionFields { get; private set; }

        public int TypeDefinitionByValArg { get; private set; }

        public int TypeDefinitionRuntimeInfo { get; private set; }


        // MonoClassDef Offsets
        public int TypeDefinitionFieldCount { get; private set; }

        public int TypeDefinitionNextClassCache { get; private set; }


        // MonoClassGtd Offsets
        public int TypeDefinitionGenericContainer { get; private set; }

        // MonoClassGenericInst Offsets
        public int TypeDefinitionMonoGenericClass { get; private set; }


        // MonoClassRuntimeInfo Offsets

        public int TypeDefinitionRuntimeInfoDomainVtables { get; private set; }


        // MonoVTable Offsets

        public int VTable { get; private set; }


        // Managed String Offsets

        public int UnicodeString { get; private set; }

        public static MonoLibraryOffsets GetOffsets(string gameExecutableFilePath, bool force = true)
        {
#if NET5_0_OR_GREATER
            if (HackF5.UnitySpy.Util.LinuxProcess.IsSupported)
            {
                // FileVersionInfo only understands managed assembly metadata on Unix and returns
                // null for a native PE, so the version resource is parsed by hand.
                var linuxUnityVersion = HackF5.UnitySpy.Util.LinuxProcess.GetPeFileVersion(gameExecutableFilePath);
                if (string.IsNullOrEmpty(linuxUnityVersion))
                {
                    throw new NotSupportedException(
                        $"Could not read a version resource from '{gameExecutableFilePath}'.");
                }

                var linuxMachineType = HackF5.UnitySpy.Util.LinuxProcess.GetPeMachineType(gameExecutableFilePath);
                switch (linuxMachineType)
                {
                    case 0x8664:
                        return GetOffsets(linuxUnityVersion, true, BinaryFormat.PE, force);
                    case 0x14c:
                        return GetOffsets(linuxUnityVersion, false, BinaryFormat.PE, force);
                    default:
                        throw new NotSupportedException("Platform not supported");
                }
            }
#endif
            FileVersionInfo myFileVersionInfo = FileVersionInfo.GetVersionInfo(gameExecutableFilePath);
            string unityVersion = myFileVersionInfo.FileVersion;

            // Taken from here https://stackoverflow.com/questions/1001404/check-if-unmanaged-dll-is-32-bit-or-64-bit;
            // See http://www.microsoft.com/whdc/system/platform/firmware/PECOFF.mspx
            // Offset to PE header is always at 0x3C.
            // The PE header starts with "PE\0\0" =  0x50 0x45 0x00 0x00,
            // followed by a 2-byte machine type field (see the document above for the enum).
            //
            int machineType;
            using (FileStream fs = new FileStream(gameExecutableFilePath, FileMode.Open, FileAccess.Read))
            using (BinaryReader br = new BinaryReader(fs))
            {
                fs.Seek(0x3c, SeekOrigin.Begin);
                Int32 peOffset = br.ReadInt32();
                fs.Seek(peOffset, SeekOrigin.Begin);
                UInt32 peHead = br.ReadUInt32();

                if (peHead != 0x00004550) // "PE\0\0", little-endian
                {
                    throw new Exception("Can't find PE header");
                }

                machineType = br.ReadUInt16();
            }

            switch (machineType)
            {
                case 0x8664: // IMAGE_FILE_MACHINE_AMD64
                    return GetOffsets(unityVersion, true, BinaryFormat.PE, force);
                case 0x14c: // IMAGE_FILE_MACHINE_I386
                    return GetOffsets(unityVersion, false, BinaryFormat.PE, force);
                default:
                    throw new NotSupportedException("Platform not supported");
            }
        }

        public static MonoLibraryOffsets GetOffsets(string unityVersion, bool is64Bits, BinaryFormat format, bool force = true)
        {
            MonoLibraryOffsets monoLibraryOffsets = SupportedVersions.Find(
                   offsets => offsets.Is64Bits == is64Bits
                              && offsets.Format == format
                              && unityVersion.StartsWith(offsets.UnityVersion)
            );

            // TODO add code to find the best candidate instead of throwing exception.
            if (monoLibraryOffsets == null)
            {
                if (force)
                {
                    List<MonoLibraryOffsets> matchingArchitectureSupportedVersion = SupportedVersions.FindAll(v => v.Is64Bits == is64Bits && v.Format == format);
                    if (matchingArchitectureSupportedVersion.Count == 1)
                    {
                        return matchingArchitectureSupportedVersion[0];
                    }
                    else if (matchingArchitectureSupportedVersion.Count > 1)
                    {
                        // TODO add code to find the best candidate instead of throwing exception.
                    }
                }

                string mode = is64Bits ? "in 64 bits mode" : "in 32 Bits mode";
                throw new NotSupportedException($"The unity version the process is running " +
                    $"({unityVersion} {mode}) is not supported");
            }

            return monoLibraryOffsets;
        }
    }
}