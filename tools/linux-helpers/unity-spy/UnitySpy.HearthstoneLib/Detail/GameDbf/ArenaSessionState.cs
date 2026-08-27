using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HackF5.UnitySpy.HearthstoneLib.Detail.GameDbf
{
    public enum ArenaSessionState
    {
        INVALID = -1,
        NO_RUN,
        DRAFTING,
        MIDRUN,
        REDRAFTING,
        EDITING_DECK,
        REWARDS,
        MIDRUN_REDRAFT_PENDING
    }
}
