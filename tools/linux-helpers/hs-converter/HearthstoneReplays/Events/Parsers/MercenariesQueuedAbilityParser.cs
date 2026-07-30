using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class MercenariesQueuedAbilityParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public MercenariesQueuedAbilityParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            TagChange tagChange = null;
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && ((tagChange = node.Object as TagChange).Name == (int)GameTag.LETTUCE_ABILITY_TILE_VISUAL_ALL_VISIBLE
                    || tagChange.Name == (int)GameTag.LETTUCE_ABILITY_TILE_VISUAL_SELF_ONLY);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities[tagChange.Entity];
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            if (tagChange.Value == 0)
            {
                return new List<GameEventProvider> { GameEventProvider.Create(
                    tagChange.TimeStamp,
                    "MERCENARIES_ABILITY_UNQUEUED",
                    GameEvent.CreateProvider(
                        "MERCENARIES_ABILITY_UNQUEUED",
                        cardId,
                        controllerId,
                        entity.Id,
                        StateFacade,
                        null),
                    true,
                    node) };
            }
            else
            {
                var abilityEntityId = tagChange.Value;
                var abilityEntity = GameState.CurrentEntities.ContainsKey(abilityEntityId) ? GameState.CurrentEntities[abilityEntityId] : null;
                var abilityCardId = abilityEntity?.CardId;
                var abilitySpeed = abilityEntity.GetTag(GameTag.COST);
                // Only queue the player's ability when they queue it themselves, not when they are revealed
                if (controllerId == StateFacade.LocalPlayer?.PlayerId && tagChange.Name == (int)GameTag.LETTUCE_ABILITY_TILE_VISUAL_ALL_VISIBLE)
                {
                    return null;
                }
                return new List<GameEventProvider> { GameEventProvider.Create(
                    tagChange.TimeStamp,
                    "MERCENARIES_ABILITY_QUEUED",
                    GameEvent.CreateProvider(
                        "MERCENARIES_ABILITY_QUEUED",
                        cardId,
                        controllerId,
                        entity.Id,
                        StateFacade,
                        //null,
                        new {
                            AbillityEntityId = abilityEntityId,
                            AbilityCardId = abilityCardId,
                            AbilitySpeed = abilitySpeed,
                        }),
                    true,
                    node) };
            }
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
