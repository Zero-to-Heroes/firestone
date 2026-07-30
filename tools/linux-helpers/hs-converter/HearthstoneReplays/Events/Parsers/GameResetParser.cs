using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using System.Collections.Generic;
using System.Linq;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;

namespace HearthstoneReplays.Events.Parsers
{
    public class GameResetParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public GameResetParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && !StateFacade.IsBattlegrounds()
                && node.Type == typeof(Action)
                && ((node.Object as Action).Type == (int)BlockType.GAME_RESET);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && !StateFacade.IsBattlegrounds()
                && node.Type == typeof(Action)
                && ((node.Object as Action).Type == (int)BlockType.GAME_RESET);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            ParserState.PartialReset();
            return new List<GameEventProvider> { GameEventProvider.Create(
                (node.Object as Action).TimeStamp,
                "GAME_RESET_START",
                GameEvent.CreateProvider(
                    "GAME_RESET_START",
                    null,
                    -1,
                    -1,
                    StateFacade
                ),
                true,
                node
            )};
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var action = node.Object as Action;
            var actionTimestamp = action.TimeStamp;
            var actionEndTimestamp = action.Data[action.Data.Count - 1].TimeStamp;
            actionEndTimestamp = actionEndTimestamp.AddMilliseconds(1);
            return new List<GameEventProvider> { GameEventProvider.Create(
                actionEndTimestamp,
                "GAME_RESET_END",
                GameEvent.CreateProvider(
                    "GAME_RESET_END",
                    null,
                    -1,
                    -1,
                    StateFacade
                ),
                true,
                node
            )};
        }
    }
}
