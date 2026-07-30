using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using System.Linq;

namespace HearthstoneReplays.Events.Parsers
{
    public class ShuffleDeckParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public ShuffleDeckParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(ShuffleDeck);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var shuffleDeck = node.Object as ShuffleDeck;
            return new List<GameEventProvider>()
            {
                GameEventProvider.Create(
                   shuffleDeck.TimeStamp,
                   "SHUFFLE_DECK",
                   () =>
                   {
                       return new GameEvent
                       {
                           Type = "SHUFFLE_DECK",
                           Value = new
                           {
                               PlayerId = shuffleDeck.PlayerId,
                               LocalPlayer = StateFacade.LocalPlayer,
                               OpponentPlayer = StateFacade.OpponentPlayer,
                           }
                       };
                   },
                   false,
                   node)
            };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
