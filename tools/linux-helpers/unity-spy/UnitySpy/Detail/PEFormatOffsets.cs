// ReSharper disable IdentifierTypo
namespace HackF5.UnitySpy.Detail
{

    public class PEFormatOffsets
    {
        // offsets taken from https://docs.microsoft.com/en-us/windows/desktop/Debug/pe-format
        public const int Signature = 0x3c;

        // 32 bits
        public const int ExportDirectoryIndexPE = 0x78;

        // 64 bits
        public const int ExportDirectoryIndexPE32Plus = 0x88;

        public const int NumberOfFunctions = 0x14;

        public const int FunctionAddressArrayIndex = 0x1c;

        public const int FunctionNameArrayIndex = 0x20;

        public const int FunctionEntrySize = 4;

        public static int GetExportDirectoryIndex(bool is64Bits)
        {
            return is64Bits ? ExportDirectoryIndexPE32Plus : ExportDirectoryIndexPE;
        }
    }
}