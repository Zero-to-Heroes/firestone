using HearthstoneReplays.Parser;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HearthstoneReplays.Events.Parsers.Controls
{
    internal class BattlegroundsControls
    {
        public static HashSet<Type> EXCLUDED_PARSERS = new HashSet<Type>
        {
            typeof(MinionsWillDieParser),
            typeof(CardRevealedParser),
            typeof(EntityUpdateParser),
            //typeof(DataScriptChangedParser), // Needed for gold enchantments
            typeof(CostChangedParser),
            typeof(MinionOnBoardAttackUpdatedParser),
            //typeof(MinionSummonedParser), // Needed for minions highlights
            typeof(LinkedEntityParser),
            typeof(CopiedFromEntityIdParser),
            typeof(ParentCardChangedParser),
            // SubSpell is hard-coded in DataHandler
        };
    }
}
