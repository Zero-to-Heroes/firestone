using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HackF5.UnitySpy.HearthstoneLib
{
    public class Logger
    {
        public static Action<string> LogHandler = Console.WriteLine;

        public static void Log(string msg)
        {
            LogHandler.Invoke(msg);
        }
    }

    public class MessageEventArgs: EventArgs
    {
        public string Message { get; set; }
    }
}
