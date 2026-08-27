namespace HackF5.UnitySpy.Util
{
    using HackF5.UnitySpy.Detail;
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Text;

    public class MemoryReadingUtils
    {
        private ProcessFacade process;

        private List<IntPtr> pointersShown = new List<IntPtr>();

        public MemoryReadingUtils(ProcessFacade process)
        {
            this.process = process;
        }

        public void ReadMemory(IntPtr address, int length, int stepSize = 4, int recursiveDepth = 0)
        {
            StringBuilder strBuilder = new StringBuilder();

            this.ReadMemoryRecursive(address, length, stepSize, recursiveDepth, strBuilder);

            File.WriteAllText("Memory Dump - " + DateTime.Now.ToString("yyyy-dd-M--HH-mm-ss.fff") + ".txt", strBuilder.ToString());
        }

        private void ReadMemoryRecursive(IntPtr address, int length, int stepSize, int recursiveDepth, StringBuilder strBuilder)
        {
            for (int i = 0; i < length; i += stepSize)
            {
                this.SingleReadMemoryRecursive(IntPtr.Add(address, i), length, stepSize, recursiveDepth, strBuilder);
            }
        }

        private void SingleReadMemoryRecursive(IntPtr address, int length, int stepSize, int recursiveDepth, StringBuilder strBuilder)
        {
            string addressStr = address.ToString("X");

            strBuilder.AppendLine("========================================== Reading Memory at " + addressStr + " Depth = " + recursiveDepth + " ========================================== ");

            var ptr = Constants.NullPtr;
            if (address != Constants.NullPtr)
            {
                try
                {
                    ptr = this.process.ReadPtr(address);
                }
                catch (Exception)
                {
                }
            }

            try
            {
                strBuilder.AppendLine("Value as int32: " + this.process.ReadInt32(address));
                strBuilder.AppendLine("Value as uint32: " + this.process.ReadUInt32(address));
                strBuilder.AppendLine("Value as pointer32: " + this.process.ReadUInt32(address).ToString("X"));
                strBuilder.AppendLine("Value as pointer64: " + this.process.ReadUInt64(address).ToString("X"));

                byte[] stringBytes = new byte[stepSize];
                for (int i = 0; i < stepSize; i++)
                {
                    stringBytes[i] = this.process.ReadByte(address + i);
                }

                strBuilder.AppendLine("Value as string: " + stringBytes.ToAsciiString());
                strBuilder.AppendLine("Value as string (Unicode): " + Encoding.Unicode.GetString(stringBytes, 0, stepSize));
            }
            catch (Exception)
            {
                strBuilder.AppendLine("No possible values found");
                return;
            }

            if (ptr != Constants.NullPtr)
            {
                if (this.pointersShown.Contains(ptr))
                {
                    strBuilder.AppendLine("Pointer already shown: " + ptr);
                }
                else
                {
                    try
                    {
                        strBuilder.AppendLine("Value as char *: " + this.process.ReadAsciiString(ptr));
                    }
                    catch (Exception)
                    {
                    }

                    if (recursiveDepth > 0)
                    {
                        this.ReadMemoryRecursive(ptr, length, stepSize, recursiveDepth - 1, strBuilder);
                    }

                    this.pointersShown.Add(ptr);
                }
            }
        }
    }
}
