using JetBrains.Annotations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HackF5.UnitySpy.HearthstoneLib.Detail.ArenaInfo
{
    [PublicAPI]
    public interface IRewardInfo
    {
        int Type { get; }
        long Amount { get; }
        int BoosterId { get; }
        bool IsCrowdsFavor { get; set; }
    }
}
