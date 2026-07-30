using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData.Meta;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using System.Linq;

namespace HearthstoneReplays.Events.Parsers
{
    public class RemovedFromHistoryParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public RemovedFromHistoryParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return false;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(MetaData)
                && (node.Object as MetaData).Meta == (int)MetaDataType.HISTORY_REMOVE_ENTITIES;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var meta = node.Object as MetaData;
            var infos = meta.MetaInfo;
            var result = new List<GameEventProvider>();
            foreach (var info in infos)
            {
                var entity = GameState.CurrentEntities.GetValueOrDefault(info.Entity);
                if (entity?.Entity != null)
                {
                    result.Add(GameEventProvider.Create(
                        meta.TimeStamp,
                        "REMOVE_FROM_HISTORY",
                        GameEvent.CreateProvider(
                            "REMOVE_FROM_HISTORY",
                            entity.CardId,
                            entity.GetController(),
                            entity.Id,
                            StateFacade,
                            null),
                        true,
                        node));
                }
            }
            return result;
        }
    }
}
