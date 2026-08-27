// ReSharper disable IdentifierTypo
namespace HackF5.UnitySpy.Offsets
{
    public static class MachOFormatOffsets
    {
        // offsets taken from https://opensource.apple.com/source/xnu/xnu-4570.71.2/EXTERNAL_HEADERS/mach-o/loader.h.auto.html
        public const int NumberOfCommands = 0x10;

        public const int LoadCommands = 0x20;

        public const int CommandSize = 0x04;

        public const int SymbolTableOffset = 0x08;

        public const int NumberOfSymbols = 0x0c;

        public const int StringTableOffset = 0x10;

        public const int NListValue = 0x08;

        public const int SizeOfNListItem = 0x10;
    }
}