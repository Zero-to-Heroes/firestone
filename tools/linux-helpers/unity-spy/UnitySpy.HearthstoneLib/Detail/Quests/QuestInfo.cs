using System.Collections.Generic;

namespace HackF5.UnitySpy.HearthstoneLib.Detail.Quests
{
    public class QuestsLog
    {
        public IReadOnlyList<QuestInfo> Quests { get; set; }
    }

    public class QuestInfo { 
        public int Id { get; set; }

        public int Progress { get; set; }

        public int Status { get; set; }

    }
}
