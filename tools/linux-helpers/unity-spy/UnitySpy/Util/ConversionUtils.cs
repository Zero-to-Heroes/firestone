namespace HackF5.UnitySpy.Util
{
    using System;
    using System.Linq;
    using System.Text;

    public static class ConversionUtils
    {
        public static string ToAsciiString(this byte[] buffer, int start = 0)
        {
            int length = 0;
            for (int i = start; i < buffer.Length && buffer[i] != 0; i++)
            {
                length++;
            }
            return Encoding.ASCII.GetString(buffer, start, length);
        }

        public static int ToInt32(this byte[] buffer, int start = 0) => BitConverter.ToInt32(buffer, start);

        public static uint ToUInt32(this byte[] buffer, int start = 0) => BitConverter.ToUInt32(buffer, start);

        public static ulong ToUInt64(this byte[] buffer, int start = 0) => BitConverter.ToUInt64(buffer, start);

        public static char ToChar(this byte[] buffer) => BitConverter.ToChar(buffer, 0);

        public static ushort ToUInt16(this byte[] buffer) => BitConverter.ToUInt16(buffer, 0);

        public static short ToInt16(this byte[] buffer) => BitConverter.ToInt16(buffer, 0);

        public static ulong ToUInt64(this byte[] buffer) => BitConverter.ToUInt64(buffer, 0);

        public static long ToInt64(this byte[] buffer) => BitConverter.ToInt64(buffer, 0);

        public static float ToSingle(this byte[] buffer) => BitConverter.ToSingle(buffer, 0);

        public static double ToDouble(this byte[] buffer) => BitConverter.ToDouble(buffer, 0);

        public static byte ToByte(this byte[] buffer) => buffer[0];
    }
}