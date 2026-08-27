using System;
using System.Collections.Generic;

namespace HearthstoneReplays.Parser.ReplayData.GameActions
{
    internal interface IEntityData
    {
        DateTime TimeStamp { get; set; }
        string CardId { get; set; }
        int Entity { get; set; }
        List<Tag> Tags { get; set; }
    }
}