using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class ExcavateTierChangedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public ExcavateTierChangedParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.CURRENT_EXCAVATE_TIER;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            List<Tag> tags = null;
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(PlayerEntity)
                && ((tags = (node.Object as PlayerEntity).Tags).Find(tag => tag.Name == (int)GameTag.CURRENT_EXCAVATE_TIER) != null
                    || tags.Find(tag => tag.Name == (int)GameTag.MAX_EXCAVATE_TIER) != null);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity);
            if (entity == null)
            {
                return null;
            }

            var maxExcavateTier = entity.GetTag(GameTag.MAX_EXCAVATE_TIER, 0);
            var currentExcavateTier = tagChange.Value;
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                 "EXCAVATE_TIER_CHANGED",
                GameEvent.CreateProvider(
                    "EXCAVATE_TIER_CHANGED",
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //null,
                    new {
                        CurrentTier = currentExcavateTier,
                        MaxTier = maxExcavateTier,
                    }),
                true,
                node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            PlayerEntity playerEntity = node.Object as PlayerEntity;
            var maxExcavateTier = playerEntity.Tags
                .Find(tag => tag.Name == (int)GameTag.MAX_EXCAVATE_TIER)
                ?.Value ?? 3;
            var currentExcavateTier = playerEntity.Tags
                .Find(tag => tag.Name == (int)GameTag.CURRENT_EXCAVATE_TIER)
                ?.Value ?? 0;

            var controllerId = playerEntity.GetEffectiveController();
            return new List<GameEventProvider> { GameEventProvider.Create(
                playerEntity.TimeStamp,
                 "EXCAVATE_TIER_CHANGED",
                GameEvent.CreateProvider(
                    "EXCAVATE_TIER_CHANGED",
                    null,
                    controllerId,
                    playerEntity.Id,
                    StateFacade,
                    //null,
                    new {
                        CurrentTier = currentExcavateTier,
                        MaxTier = maxExcavateTier,
                    }),
                true,
                node) };
        }
    }
}
