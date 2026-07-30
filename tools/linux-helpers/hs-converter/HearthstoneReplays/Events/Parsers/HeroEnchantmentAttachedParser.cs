using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class HeroEnchantmentAttachedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public HeroEnchantmentAttachedParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            TagChange tagChange = null;
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (tagChange = node.Object as TagChange).Name == (int)GameTag.ZONE
                && tagChange.Value == (int)Zone.PLAY
                && GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity).GetCardType() == (int)CardType.ENCHANTMENT
                && GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity).GetZone() != (int)Zone.PLAY;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(ShowEntity)
                && (node.Object as ShowEntity).GetTag(GameTag.ATTACHED) > 0
                && (node.Object as ShowEntity).GetTag(GameTag.ZONE) == (int)Zone.PLAY;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity);
            var creatorEntityId = entity?.GetTag(GameTag.CREATOR) ?? -1;
            var creatorEntity = GameState.CurrentEntities.GetValueOrDefault(creatorEntityId);
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            var attachedToEntityId = entity.GetTag(GameTag.ATTACHED);
            var attachedToEntity = GameState.CurrentEntities.GetValueOrDefault(attachedToEntityId);
            if (attachedToEntity == null)
            {
                return null;
            }

            if (attachedToEntityId != StateFacade.LocalPlayer.Id 
                && attachedToEntityId != StateFacade.OpponentPlayer.Id
                && attachedToEntity.GetCardType() != (int)CardType.HERO
                && attachedToEntity.GetCardType() != (int)CardType.HERO_POWER)
            {
                return null;
            }

            var tags = entity.GetTagsCopy();
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                 "ENCHANTMENT_ATTACHED",
                GameEvent.CreateProvider(
                    "ENCHANTMENT_ATTACHED",
                    cardId,
                    controllerId,
                    entity.Entity,
                    StateFacade,
                    new {
                        AttachedTo = attachedToEntityId,
                        Tags = tags,
                        CreatorEntityId = creatorEntity?.Entity,
                        CreatorCardId = creatorEntity?.CardId,
                    }),
                true,
                node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var showEntity = node.Object as ShowEntity;
            var attachedTo = showEntity.GetTag(GameTag.ATTACHED);
            var attachedToEntity = GameState.CurrentEntities.GetValueOrDefault(attachedTo);
            var creatorEntityId = showEntity.GetTag(GameTag.CREATOR);
            var creatorEntity = GameState.CurrentEntities.GetValueOrDefault(creatorEntityId);
            var cardId = showEntity.CardId;
            var controllerId = showEntity.GetEffectiveController();
            if (attachedTo != StateFacade.LocalPlayer.Id
                && attachedTo != StateFacade.OpponentPlayer.Id
                && attachedToEntity.GetCardType() != (int)CardType.HERO
                && attachedToEntity.GetCardType() != (int)CardType.HERO_POWER)
            {
                return null;
            }

            var tags = showEntity.GetTagsCopy();
            return new List<GameEventProvider> { GameEventProvider.Create(
                showEntity.TimeStamp,
                 "ENCHANTMENT_ATTACHED",
                GameEvent.CreateProvider(
                    "ENCHANTMENT_ATTACHED",
                    cardId,
                    controllerId,
                    showEntity.Entity,
                    StateFacade,
                    new {
                        AttachedTo = attachedTo,
                        Tags = tags,
                        CreatorEntityId = creatorEntityId,
                        CreatorCardId = creatorEntity?.CardId,
                    }),
                true,
                node) };
        }
    }
}
