using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class WheelOfDeathCounterParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public WheelOfDeathCounterParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            TagChange tagChange;
            return stateType == StateType.PowerTaskList
                // Limit it to merceanries, the only mode where this is used, to limit the impact on the number of events sent (esp. in BG)
                && node.Type == typeof(TagChange)
                && (tagChange = node.Object as TagChange).Name == (int)GameTag.TAG_SCRIPT_DATA_NUM_1
                && GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity)?.CardId == CardIds.WheelOfDeath_WheelOfDeathCounterEnchantment_TOY_529e1;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            ShowEntity showEntity;
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(ShowEntity)
                && (showEntity = node.Object as ShowEntity).CardId == CardIds.WheelOfDeath_WheelOfDeathCounterEnchantment_TOY_529e1;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities[tagChange.Entity];
            var controllerId = entity.GetEffectiveController();
            var turnsBeforeControllerDies = tagChange.Value;
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                "WHEEL_OF_DEATH_COUNTER_UPDATED",
                GameEvent.CreateProvider(
                    "WHEEL_OF_DEATH_COUNTER_UPDATED",
                    entity.CardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //null,
                    new {
                        TurnsBeforeControllerDies = turnsBeforeControllerDies,
                    }
                ),
                true,
                node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var showEntity = node.Object as ShowEntity;
            var controllerId = showEntity.GetEffectiveController();
            var turnsBeforeControllerDies = showEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1);
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);
            return new List<GameEventProvider> { GameEventProvider.Create(
                showEntity.TimeStamp,
                "WHEEL_OF_DEATH_COUNTER_UPDATED",
                GameEvent.CreateProvider(
                    "WHEEL_OF_DEATH_COUNTER_UPDATED",
                    showEntity.CardId,
                    controllerId,
                    showEntity.Entity,
                    StateFacade,
                    //null,
                    new {
                        TurnsBeforeControllerDies = turnsBeforeControllerDies,
                    }
                ),
                true,
                node) };
        }
    }
}
