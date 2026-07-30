using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData.Meta;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using System.Linq;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;

namespace HearthstoneReplays.Events.Parsers
{
    public class BurnedCardParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public BurnedCardParser(ParserState ParserState, StateFacade facade)
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
            MetaData metadata = null;
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(MetaData)
                && (metadata = node.Object as MetaData).Meta == (int)MetaDataType.BURNED_CARD;

        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var meta = node.Object as MetaData;
            if (meta == null)
            {
                Logger.Log("Could not find meta info", "");
            }
            List<GameEventProvider> result = new List<GameEventProvider>();
            foreach (var info in meta.MetaInfo)
            {
                var entity = GameState.CurrentEntities[info.Entity];
                if (entity == null)
                {
                    Logger.Log("Could not find entity", info.Entity);
                }
                var cardId = entity.CardId;
                if (cardId == null)
                {
                    Logger.Log("Could not identify burned card id", info.Entity);
                }
                var controllerId = entity.GetEffectiveController();
                //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);
                result.Add(GameEventProvider.Create(
                    meta.TimeStamp,
                    "BURNED_CARD",
                    GameEvent.CreateProvider(
                        "BURNED_CARD",
                        cardId,
                        controllerId,
                        entity.Id,
                        StateFacade),
                    (GameEventProvider provider) =>
                    {
                        if (provider == null)
                        {
                            Logger.Log("Error: trying to instantiate an event with null provider", node.CreationLogLine);
                            return false;
                        }
                        var gameEvent = provider.SupplyGameEvent();
                        if (gameEvent == null)
                        {
                            Logger.Log("Could not identify gameEvent", provider.CreationLogLine);
                            return false;
                        }
                        if (gameEvent.Type != "CARD_REMOVED_FROM_DECK")
                        {
                            return false;
                        }
                        dynamic obj = gameEvent.Value;
                        return obj != null && (obj.CardId as string) == cardId;
                    },
                    true,
                    node));
            }
            return result;
        }

        // Before 
        public void RemoveDuplicates()
        {

        }
    }
}
