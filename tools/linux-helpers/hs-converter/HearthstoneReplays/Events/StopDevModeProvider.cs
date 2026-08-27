using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using HearthstoneReplays.Parser;
using System.Text.RegularExpressions;

namespace HearthstoneReplays.Events
{
    public class StopDevModeProvider : GameEventProvider
    {
        public StopDevModeProvider()
        {
            this.CreationLogLine = "";
        }
    }
}
