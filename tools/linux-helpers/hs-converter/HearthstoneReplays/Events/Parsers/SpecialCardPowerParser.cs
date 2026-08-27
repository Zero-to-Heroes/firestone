using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using System.Linq;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;

namespace HearthstoneReplays.Events.Parsers
{
    public class SpecialCardPowerParser : ActionParser
    {
        private static IList<string> SPECIAL_POWER_CARDS = new List<string>()
        {
            CardIds.DewProcess,
            CardIds.LorekeeperPolkelt,
            CardIds.OrderInTheCourt,
            CardIds.SphereOfSapience,
            CardIds.CityChiefEsho_TLC_110,
            CardIds.TimelessCausality_TIME_061,
        };

        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public SpecialCardPowerParser(ParserState ParserState, StateFacade facade)
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
                && ((action = node.Object as Action).Type == (int)BlockType.POWER || action.Type == (int)BlockType.TRIGGER)
                && GameState.CurrentEntities.ContainsKey(action.Entity)
                && SPECIAL_POWER_CARDS.Contains(GameState.CurrentEntities[action.Entity].CardId);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var action = node.Object as Action;
            var entity = GameState.CurrentEntities[action.Entity];
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);
            var relatedEntities = action.Data
                .Where(data => data is FullEntity)
                .Select(data => data as FullEntity)
                // So that we have also the tag modifications
                .Select(e => GameState.CurrentEntities[e.Entity])
                .ToList();
            var relatedCards = relatedEntities
                .Select(e => new
                {
                    EntityId = e.Entity,
                    CardId = e.CardId,
                    OriginalEntityId = e.GetTag(GameTag.LINKED_ENTITY, -1),
                })
                .ToList();
            return new List<GameEventProvider> {
                GameEventProvider.Create(
                    action.TimeStamp,
                    "SPECIAL_CARD_POWER_TRIGGERED",
                    GameEvent.CreateProvider(
                        "SPECIAL_CARD_POWER_TRIGGERED",
                        cardId,
                        controllerId,
                        entity.Id,
                        StateFacade,
                        //gameState,
                        new {
                            RelatedCards = relatedCards
                        }
                    ),
                    true,
                    node)
            };
        }
    }
}
