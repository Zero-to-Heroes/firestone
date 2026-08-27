using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System.Linq;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using static HearthstoneReplays.Events.CardIds;

namespace HearthstoneReplays.Events.Parsers
{
    public class BattlegroundsHeroRerollParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public BattlegroundsHeroRerollParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return false;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && StateFacade.IsBattlegrounds()
                && node.Type == typeof(ChangeEntity)
                && (node.Object as ChangeEntity).GetTag(GameTag.BACON_NUM_MULLIGAN_REFRESH_USED) > 0;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var changeEntity = node.Object as ChangeEntity;
            return new List<GameEventProvider> { GameEventProvider.Create(
                changeEntity.TimeStamp,
                "BATTLEGROUNDS_HERO_REROLL",
                GameEvent.CreateProvider(
                    "BATTLEGROUNDS_HERO_REROLL",
                    changeEntity.CardId,
                    -1,
                    changeEntity.Entity,
                    StateFacade,
                    null),
                true,
                node)
            };
        }
    }
}
