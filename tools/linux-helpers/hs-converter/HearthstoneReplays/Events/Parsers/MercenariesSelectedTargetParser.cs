using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class MercenariesSelectedTargetParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public MercenariesSelectedTargetParser(ParserState ParserState, StateFacade stateFacade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = stateFacade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            TagChange tagChange = null;
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && ((tagChange = node.Object as TagChange).Name == (int)GameTag.LETTUCE_SELECTED_TARGET);
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

            if (tagChange.Value == 0){
                return new List<GameEventProvider> { GameEventProvider.Create(
                    tagChange.TimeStamp,
                    "MERCENARIES_UNSELECTED_TARGET",
                    GameEvent.CreateProvider(
                        "MERCENARIES_UNSELECTED_TARGET",
                        cardId,
                        controllerId,
                        entity.Id,
                        StateFacade,
                        null),
                    true,
                    node) };
            }else {
                var targetEntityId = tagChange.Value;
                var targetEntity = GameState.CurrentEntities[targetEntityId];
                var targetCardId = GameState.GetCardIdForEntity(targetEntityId);
                var targetControllerId = targetEntity.GetEffectiveController();

                return new List<GameEventProvider> { GameEventProvider.Create(
                    tagChange.TimeStamp,
                    "MERCENARIES_SELECTED_TARGET",
                    GameEvent.CreateProvider(
                        "MERCENARIES_SELECTED_TARGET",
                        cardId,
                        controllerId,
                        entity.Id,
                        StateFacade,
                        //null,
                        new {
                            TargetControllerId = targetControllerId,
                            TargetCardId = targetCardId,
                            TargetEntityId = targetEntityId
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
