using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData.Meta;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using System.Linq;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;

namespace HearthstoneReplays.Events.Parsers
{
    public class SpecialTargetParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        private static List<string> SPECIAL_TARGET_CARD_IDS = new List<string>()
        {
            // The META_DATA TARGET tells us the card that was in the deck
            CardIds.FuturisticForefather_TIME_041,
        };

        public SpecialTargetParser(ParserState ParserState, StateFacade facade)
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
            MetaData metadata = null;
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(MetaData)
                && (metadata = node.Object as MetaData).Meta == (int)MetaDataType.TARGET;

        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var meta = node.Object as MetaData;
            var target = meta.MetaInfo[0]?.Entity;
            if (target == null)
            {
                return null;
            }

            var parent = node.Parent;
            if (parent.Type != typeof(Action))
            {
                return null;
            }

            var parentAction = (Action)parent.Object;
            var parentEntity = GameState.CurrentEntities.GetValueOrDefault(parentAction.Entity);
            if (!SPECIAL_TARGET_CARD_IDS.Contains(parentEntity?.CardId))
            {
                return null;
            }


            List<GameEventProvider> result = new List<GameEventProvider>
            {
                GameEventProvider.Create(
                meta.TimeStamp,
                "SPECIAL_TARGET",
                GameEvent.CreateProvider(
                    "SPECIAL_TARGET",
                    parentEntity.CardId,
                    parentEntity.GetController(),
                    parentEntity.Id,
                    StateFacade,
                    new
                    {
                        TargetCardId = GameState.CurrentEntities.GetValueOrDefault(target.Value)?.CardId,
                        TargetEntityId = target.Value,
                    }),
                null,
                true,
                node)
            };

            return result;
        }
    }
}
