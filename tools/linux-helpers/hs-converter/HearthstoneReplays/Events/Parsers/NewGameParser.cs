using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using HearthstoneReplays.Events;
using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;

namespace HearthstoneReplays.Events.Parsers
{
    public class NewGameParser : ActionParser
    {
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public NewGameParser(ParserState ParserState, StateFacade StateFacade)
        {
            this.ParserState = ParserState;
            this.StateFacade = StateFacade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.GameState
                && node.Type == typeof(Game)
                && !ParserState.ReconnectionOngoing;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            Logger.Log("will emit NEW_GAME event", node.CreationLogLine);
            return new List<GameEventProvider> { GameEventProvider.Create(
                (node.Object as Game).TimeStamp,
                "NEW_GAME",
                () => new GameEvent
                {
                    Type = "NEW_GAME",
                    Value = new
                    {
                        Spectating = StateFacade.Spectating,
                        Timestamp = Utility.GetUtcTimestamp((node.Object as Game).TimeStamp)
                    },
                },
                false,
                node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
