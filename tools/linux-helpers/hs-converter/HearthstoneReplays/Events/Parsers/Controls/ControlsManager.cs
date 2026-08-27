using HearthstoneReplays.Parser;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HearthstoneReplays.Events.Parsers.Controls
{
    internal class ControlsManager
    {
        private StateFacade stateFacade;
        private StateType stateType;

        public ControlsManager(StateFacade stateFacade, StateType stateType)
        {
            this.stateFacade = stateFacade;
            this.stateType = stateType;
        }

        public bool Applies(ActionParser parser)
        {
            if (stateFacade.IsBattlegrounds())
            {
                if (BattlegroundsControls.EXCLUDED_PARSERS.Contains(parser.GetType())) {
                    return false;
                }
            }
            return true;
        }
    }
}
