using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HackF5.UnitySpy.HearthstoneLib.Detail
{
    public class Utils
    {
        public static dynamic TryGetField(dynamic node, string fieldNode)
        {
            try
            {
                return node?[fieldNode];
            }
            catch (Exception e)
            {
                return null;
            }
        }

        // Shows issue where we need to reset MindVision to re-read the full memory
        public static bool IsMemoryReadingIssue(Exception e)
        {
           return e.Message.Contains("ReadProcessMemory") && e.Message.Contains("WriteProcessMemory");
        }
    }
}
