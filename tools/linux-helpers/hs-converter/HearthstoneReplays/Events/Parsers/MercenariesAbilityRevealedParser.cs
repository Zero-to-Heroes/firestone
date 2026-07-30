using HearthstoneReplays.Parser;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class MercenariesAbilityRevealedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public MercenariesAbilityRevealedParser(ParserState ParserState, StateFacade facade)
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
                && ((node.Type == typeof(FullEntity) && (node.Object as FullEntity).GetTag(GameTag.ZONE) == (int)Zone.LETTUCE_ABILITY)
            || (node.Type == typeof(ShowEntity) && (node.Object as ShowEntity).GetTag(GameTag.ZONE) == (int)Zone.LETTUCE_ABILITY));
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            if (node.Type == typeof(FullEntity))
            {
                return CreateFromFullEntity(node);
            }
            else if (node.Type == typeof(ShowEntity))
            {
                return CreateFromShowEntity(node);
            }
            return null;
        }

        private List<GameEventProvider> CreateFromFullEntity(Node node)
        {
            var fullEntity = node.Object as FullEntity;
            if (fullEntity.GetCardType() != (int)CardType.LETTUCE_ABILITY)
            {
                return null;
            }

            var creatorEntityId = fullEntity.GetTag(GameTag.CREATOR);
            var creatorEntity = GameState.CurrentEntities.GetValueOrDefault(creatorEntityId);
            // Don't include the abilities created by treasures like Frost Volley
            if (creatorEntity?.GetCardType() == (int)CardType.ENCHANTMENT)
            {
                return null;
            }

            var abilityOwner = fullEntity.GetTag(GameTag.LETTUCE_ABILITY_OWNER);
            var abilityCooldownConfig = fullEntity.GetTag(GameTag.LETTUCE_COOLDOWN_CONFIG);
            var abilityCurrentCooldown = fullEntity.GetTag(GameTag.LETTUCE_CURRENT_COOLDOWN);
            var abilitySpeed = fullEntity.GetTag(GameTag.COST);
            var isTreasure = fullEntity.GetTag(GameTag.LETTUCE_IS_TREASURE_CARD) == 1;
            var controllerId = fullEntity.GetEffectiveController();
            var cardId = fullEntity.CardId;
            var eventName = fullEntity.GetTag(GameTag.LETTUCE_IS_EQUPIMENT) == 1 ? "MERCENARIES_EQUIPMENT_REVEALED" : "MERCENARIES_ABILITY_REVEALED";
            return new List<GameEventProvider> { GameEventProvider.Create(
                fullEntity.TimeStamp,
                eventName,
                GameEvent.CreateProvider(
                    eventName,
                    cardId,
                    controllerId,
                    fullEntity.Id,
                    StateFacade,
                    //null,
                    new {
                        AbilityOwnerEntityId = abilityOwner,
                        AbilityCooldownConfig = abilityCooldownConfig == -1 ? (int?)null : abilityCooldownConfig,
                        AbilityCurrentCooldown = abilityCurrentCooldown == -1 ? (int?)null : abilityCurrentCooldown,
                        AbilitySpeed = abilitySpeed == -1 ? (int?)null : abilitySpeed,
                        IsTreasure = isTreasure,
                        AbilityNameData1 = fullEntity.GetTag(GameTag.CARD_NAME_DATA_1),
                    }
                ),
                true,
                node) };
        }


        private List<GameEventProvider> CreateFromShowEntity(Node node)
        {
            var showEntity = node.Object as ShowEntity;
            if (showEntity.GetCardType() != (int)CardType.LETTUCE_ABILITY)
            {
                return null;
            }

            var abilityOwner = showEntity.GetTag(GameTag.LETTUCE_ABILITY_OWNER);
            var abilityCooldownConfig = showEntity.GetTag(GameTag.LETTUCE_COOLDOWN_CONFIG);
            var abilityCurrentCooldown = showEntity.GetTag(GameTag.LETTUCE_CURRENT_COOLDOWN);
            var abilitySpeed = showEntity.GetTag(GameTag.COST);
            var isTreasure = showEntity.GetTag(GameTag.LETTUCE_IS_TREASURE_CARD) == 1;
            var controllerId = showEntity.GetEffectiveController();
            var cardId = showEntity.CardId;
            var eventName = showEntity.GetTag(GameTag.LETTUCE_IS_EQUPIMENT) == 1 ? "MERCENARIES_EQUIPMENT_REVEALED" : "MERCENARIES_ABILITY_REVEALED";
            return new List<GameEventProvider> { GameEventProvider.Create(
                showEntity.TimeStamp,
                eventName,
                GameEvent.CreateProvider(
                    eventName,
                    cardId,
                    controllerId,
                    showEntity.Entity,
                    StateFacade,
                    //null,
                    new {
                        AbilityOwnerEntityId = abilityOwner,
                        AbilityCooldownConfig = abilityCooldownConfig == -1 ? (int?)null : abilityCooldownConfig,
                        AbilityCurrentCooldown = abilityCurrentCooldown == -1 ? (int?)null : abilityCurrentCooldown,
                        AbilitySpeed = abilitySpeed == -1 ? (int?)null : abilitySpeed,
                        IsTreasure = isTreasure,
                    }
                ),
                true,
                node) };
        }
    }
}
