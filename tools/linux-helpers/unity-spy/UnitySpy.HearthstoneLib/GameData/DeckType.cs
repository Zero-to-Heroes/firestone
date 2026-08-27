using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HackF5.UnitySpy.HearthstoneLib.GameData
{
    public enum DeckType
    {
        CLIENT_ONLY_DECK = -1,
        UNKNOWN_DECK_TYPE = 0,
        NORMAL_DECK = 1,
        AI_DECK = 2,
        DRAFT_DECK = 4,
        PRECON_DECK = 5,
        TAVERN_BRAWL_DECK = 6,
        FSG_BRAWL_DECK = 7,
        PVPDR_DECK = 8,
        PVPDR_DISPLAY_DECK = 9,
        HIDDEN_DECK = 1000
    }
}
