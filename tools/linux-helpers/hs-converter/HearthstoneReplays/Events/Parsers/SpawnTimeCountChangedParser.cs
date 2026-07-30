using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class SpawnTimeCountChangedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public SpawnTimeCountChangedParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.SPAWN_TIME_COUNT;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            FullEntity entity = GameState.CurrentEntities.TryGetValue(tagChange.Entity, out entity) ? entity : null;
            if (entity == null)
            {
                return null;
            }

            // For now only use it for enchantments
            if (entity.GetTag(GameTag.CARDTYPE) != (int)CardType.ENCHANTMENT)
            {
                return null;
            }
             

            var cardId = string.IsNullOrEmpty(entity.CardId) ? null : entity.CardId;
            var controllerId = entity.GetEffectiveController();
            return new List<GameEventProvider> { GameEventProvider.Create(
                    tagChange.TimeStamp,
                    "SPAWN_TIME_COUNT_CHANGED",
                    GameEvent.CreateProvider(
                        "SPAWN_TIME_COUNT_CHANGED",
                        cardId,
                        controllerId,
                        entity.Id,
                        StateFacade,
                        //null,
                        new {
                            Count = tagChange.Value,
                        }),
                    true,
                    node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
