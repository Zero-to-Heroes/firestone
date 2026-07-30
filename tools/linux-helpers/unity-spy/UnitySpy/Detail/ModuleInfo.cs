namespace HackF5.UnitySpy.Detail
{
    using System;
    using System.Diagnostics;

    [DebuggerDisplay("{" + nameof(ModuleInfo.ModuleName) + "}")]
    public class ModuleInfo
    {
        public ModuleInfo(string moduleName, IntPtr baseAddress, uint size)
        {
            this.ModuleName = moduleName;
            this.BaseAddress = baseAddress;
            this.Size = size;
        }

        public IntPtr BaseAddress { get; }

        public string ModuleName { get; }

        public uint Size { get; }
    }
}