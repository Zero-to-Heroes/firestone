using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using HearthstoneReplays.Parser;
using System.Text.RegularExpressions;

namespace HearthstoneReplays
{
    public class GameMetaData
    {
        public int BuildNumber { get; set; }

        public int FormatType { get; set; }

        public int GameType { get; set; }

        public int ScenarioID { get; set; }
    }
}
