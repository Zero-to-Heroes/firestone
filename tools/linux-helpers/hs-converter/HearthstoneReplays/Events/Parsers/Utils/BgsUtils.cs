using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HearthstoneReplays.Events.Parsers.Utils
{
    internal class BgsUtils
    {
        public static bool IsBaconGhost(string cardId)
        {
            return cardId == CardIds.LadyDeathwhisper_TB_BaconShop_HERO_Deathwhisper
                || cardId == CardIds.Kelthuzad_TB_BaconShop_HERO_KelThuzad;
        }

        public static bool IsBaconBartender(string cardId)
        {
            return cardId?.StartsWith(CardIds.BartenderBob) ?? false;
        }

        public static bool IsBaconEnchantment(string cardId)
        {
            return cardId == CardIds.BaconphheroHeroic || cardId == CardIds.TagtransferplayerenchantDntEnchantment_Bacon_TagTransferPlayerE;
        }
    }
}
