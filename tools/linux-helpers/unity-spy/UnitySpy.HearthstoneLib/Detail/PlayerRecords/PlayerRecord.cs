using HackF5.UnitySpy.HearthstoneLib.GameData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HackF5.UnitySpy.HearthstoneLib.Detail.PlayerProfile
{
    public class PlayerProfileInfo
    {
        public List<PlayerRecord> PlayerRecords { get; set; }
        public List<PlayerClass> PlayerClasses { get; set; }

    }

    public class PlayerRecord
    {
        public int Data { get; set; }
        public int Losses { get; set; }
        public int RecordType { get; set; }
        public int Ties { get; set; }
        public int Wins { get; set; }
    }

    public class PlayerClass
    {
        public int TagClass { get; set; }
        public int Level { get; set; }
        // Golden, Premium need to be computed from achievements
    }
}
