using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class ZonePositionChangedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        //private long lastEventSentTicks;
        //private static long DEBOUNCE_TIME_IN_MS = 1000;

        public ZonePositionChangedParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            // Limit it to merceanries, the only mode where this is used, to limit the impact on the number of events sent (esp. in BG)
            //var elapsed = TimeSpan.FromTicks(DateTime.UtcNow.Ticks - lastEventSentTicks);
            //var isOkToResend = ParserState.IsMercenaries()
            //    // We still need an event to be sent at some point to force the zone ordering computation
            //    || (ParserState.IsBattlegrounds() && elapsed.TotalMilliseconds > DEBOUNCE_TIME_IN_MS);

            return stateType == StateType.PowerTaskList
                //&& isOkToResend
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.ZONE_POSITION;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            //lastEventSentTicks = DateTime.UtcNow.Ticks;
            var tagChange = node.Object as TagChange;
            // Not sure what this means, as ZONE_POSITION seems to be 1-based (receiving The Coin puts it 
            // in ZONE_POSITION = 5)
            if (tagChange.Value == 0)
            {
                return null;
            }

            var entity = GameState.CurrentEntities[tagChange.Entity];
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController(); 
            var currentPosition = entity.GetZone();
            var zonePosition = tagChange.Value;
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                "ZONE_POSITION_CHANGED",
                GameEvent.CreateProvider(
                    "ZONE_POSITION_CHANGED",
                    null,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    new {
                        ZonePosition = zonePosition,
                        ZoneUpdates = new List<dynamic>() {
                            new { CardId = cardId, EntityId = entity.Id, ControllerId = controllerId, Zone = currentPosition, NewPosition = zonePosition }
                        },
                    }
                ),
                true,
                node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
