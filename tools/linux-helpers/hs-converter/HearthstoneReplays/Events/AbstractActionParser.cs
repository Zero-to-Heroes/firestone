using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using HearthstoneReplays.Events.Parsers.Controls;
using HearthstoneReplays.Parser;

namespace HearthstoneReplays.Events
{
    public abstract class AbstractActionParser : ActionParser
    {
        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return !BattlegroundsControls.EXCLUDED_PARSERS.Contains(this.GetType());
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return !BattlegroundsControls.EXCLUDED_PARSERS.Contains(this.GetType());
        }

        public abstract List<GameEventProvider> CreateGameEventProviderFromClose(Node node);
        public abstract List<GameEventProvider> CreateGameEventProviderFromNew(Node node);
    }
}
