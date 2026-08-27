using HearthstoneReplays.Parser;
using System.Linq;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using static HearthstoneReplays.Events.CardIds;
using HearthstoneReplays.Parser.ReplayData.GameActions;

namespace HearthstoneReplays.Events.Parsers
{
    // Unused
    public class BattlegroundsAfterPlayerBoardsRevealedParser : ActionParser
    {
        private BattlegroundsPlayerBoardParser Parser { get; set; }

        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public BattlegroundsAfterPlayerBoardsRevealedParser(ParserState ParserState, StateFacade helper)
        {
            this.Parser = new BattlegroundsPlayerBoardParser(ParserState, helper);
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && ParserState.GameState.GetGameEntity() != null
                && Parser.IsApplyOnNewNode(node, stateType);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var boards = Parser.CreateGameEventProviderFromNew(node);
            if (boards == null || boards.Count == 0)
            {
                return null;
            }

            GameState.BgsHasSentNextOpponent = false;
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}

