using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using System.Linq;

namespace HearthstoneReplays.Events.Parsers
{
    public class DecklistUpdateParser : ActionParser
    {

        private static List<int> DECK_ID_SCENARIOS = new List<int> { 
            // ToT normal and heroic
            3428, 3429, 3430, 3431, 3432, 3438, 3433, 3434, 3435, 3436, 3437, 3439, };

        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public DecklistUpdateParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return false;
        }

        // We use the action so that the event is emitted after all the "create card in deck" events
        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && IsDecklistUpdateAction(node);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var action = node.Object as Parser.ReplayData.GameActions.Action;
            var cardsCreatedInDeck = action.Data
                    .Where(data => data.GetType() == typeof(FullEntity))
                    .Select(data => (FullEntity)data)
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.DECK)
                    .ToList();
            if (cardsCreatedInDeck == null || cardsCreatedInDeck.Count == 0)
            {
                return null;
            }
            // Time the "new deck" action right after all the "create card in deck" ones
            var timestamp = cardsCreatedInDeck.Last().TimeStamp;
            var fullEntities = action.Data
                    .Where(data => data.GetType() == typeof(FullEntity))
                    .Select(data => (FullEntity)data)
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                    .Where(entity =>
                     {
                         if (DECK_ID_SCENARIOS.Contains(StateFacade.ScenarioID))
                         {
                             return entity.GetTag(GameTag.HERO_DECK_ID) > 0;

                         }
                         return entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO
                             && entity.GetEffectiveController() == StateFacade.OpponentPlayer.PlayerId;
                     })
                    .ToList();
            return fullEntities.Select(fullEntity =>
                {
                    var deckId = DECK_ID_SCENARIOS.Contains(StateFacade.ScenarioID)
                        ? "" + fullEntity.GetTag(GameTag.HERO_DECK_ID)
                        : fullEntity.CardId;
                    var controllerId = fullEntity.GetEffectiveController();
                    return GameEventProvider.Create(
                        timestamp,
                        "DECKLIST_UPDATE",
                        GameEvent.CreateProvider(
                            "DECKLIST_UPDATE",
                            null,
                            controllerId,
                            -1,
                            StateFacade,
                            //null,
                            new
                            {
                                DeckId = deckId,
                            }),
                        true,
                        node);
                })
                .ToList();
        }

        private bool IsDecklistUpdateAction(Node node)
        {
            if (node.Type != typeof(Parser.ReplayData.GameActions.Action))
            {
                return false;
            }
            var action = node.Object as Parser.ReplayData.GameActions.Action;
            return action.Data != null
                && (action.Data
                    .Where(data => data.GetType() == typeof(FullEntity))
                    .Select(data => (FullEntity)data)
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                    .Where(entity =>
                    {
                        if (DecklistUpdateParser.DECK_ID_SCENARIOS.Contains(StateFacade.ScenarioID))
                        {
                            return entity.GetTag(GameTag.HERO_DECK_ID) > 0;

                        }
                        return entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO
                            && entity.GetEffectiveController() == StateFacade.OpponentPlayer.PlayerId;
                    })
                    .ToList()
                    .Count > 0);
        }
    }
}
