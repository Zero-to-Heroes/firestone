using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class HeroPowerUsedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public HeroPowerUsedParser(ParserState ParserState, StateFacade facade)
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
                && node.Type == typeof(Parser.ReplayData.GameActions.Action)
                && (node.Object as Parser.ReplayData.GameActions.Action).Type == (int)BlockType.POWER;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {

            var action = node.Object as Parser.ReplayData.GameActions.Action;
            if (!GameState.CurrentEntities.ContainsKey(action.Entity))
            {
                return null;
            }

            var entity = GameState.CurrentEntities[action.Entity];
            if (GameState.CurrentEntities[action.Entity].GetTag(GameTag.CARDTYPE) != (int)CardType.HERO_POWER)
            {
                return null;
            }

            // Some hero powers (like Galakrond's Greed) have nested power calls for a single use (maybe when they are multi-step processes)
            if (action.EffectIndex != 0)
            {
                return null;
            }


            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);
            return new List<GameEventProvider> { GameEventProvider.Create(
                    action.TimeStamp,
                    "HERO_POWER_USED",
                    GameEvent.CreateProvider(
                        "HERO_POWER_USED",
                        cardId,
                        controllerId,
                        entity.Id,
                        StateFacade
                        //gameState
                    ),
                    true,
                    node) };
        }
        }
}
