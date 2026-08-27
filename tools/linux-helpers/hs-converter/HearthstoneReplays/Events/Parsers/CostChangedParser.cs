using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class CostChangedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public CostChangedParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                // This is for now only useful to get the speed update in Mercenaries, so we try to restrict the number of events
                // Need it to properly support Lady Prestor + Dredge / discover in your own deck
                //&& ParserState.IsMercenaries()
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.COST;
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

            // Equipment shouldn't have their cost changed
            if (entity.GetTag(GameTag.LETTUCE_IS_EQUPIMENT) == 1)
            {
                return null;
            }
             

            var cardId = string.IsNullOrEmpty(entity.CardId) ? null : entity.CardId;
            var controllerId = entity.GetEffectiveController();
            var abilityOwner = entity.GetTag(GameTag.LETTUCE_ABILITY_OWNER);
            return new List<GameEventProvider> { GameEventProvider.Create(
                    tagChange.TimeStamp,
                    "COST_CHANGED",
                    GameEvent.CreateProvider(
                        "COST_CHANGED",
                        cardId,
                        controllerId,
                        entity.Id,
                        StateFacade,
                        //null,
                        new {
                            NewCost = tagChange.Value,
                            AbilityOwnerEntityId = abilityOwner,
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
