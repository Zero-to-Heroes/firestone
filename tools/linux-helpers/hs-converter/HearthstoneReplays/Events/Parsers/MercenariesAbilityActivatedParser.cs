using HearthstoneReplays.Parser;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class MercenariesAbilityActivatedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public MercenariesAbilityActivatedParser(ParserState ParserState, StateFacade facade)
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
            Action action = null;
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(Action)
                && (action = node.Object as Action).Type == (int)BlockType.PLAY
                && GameState.CurrentEntities.ContainsKey(action.Entity)
                && GameState.CurrentEntities[action.Entity].GetZone() == (int)Zone.LETTUCE_ABILITY
                && GameState.CurrentEntities[action.Entity].GetCardType() == (int)CardType.LETTUCE_ABILITY;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var action = node.Object as Action;
            var entity = GameState.CurrentEntities[action.Entity];
            var controllerId = entity.GetEffectiveController();
            var cardId = entity.CardId;
            var abilityOwnerEntityId = entity.GetTag(GameTag.LETTUCE_ABILITY_OWNER);
            var isTreasure = entity.GetTag(GameTag.LETTUCE_IS_TREASURE_CARD) == 1;
            return new List<GameEventProvider> { GameEventProvider.Create(
                action.TimeStamp,
                "MERCENARIES_ABILITY_ACTIVATED",
                GameEvent.CreateProvider(
                    "MERCENARIES_ABILITY_ACTIVATED",
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //null,
                    new
                    {
                        AbilityOwnerEntityId = abilityOwnerEntityId,
                        IsTreasure = isTreasure,
                    }
                ),
                true,
                node) };
        }
    }
}
