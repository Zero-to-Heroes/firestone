using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System.Linq;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using static HearthstoneReplays.Events.CardIds;

namespace HearthstoneReplays.Events.Parsers
{
    public class BattlegroundsBuddyGainedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public BattlegroundsBuddyGainedParser(ParserState ParserState, StateFacade stateFacade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = stateFacade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && StateFacade.IsBattlegrounds()
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.BACON_PLAYER_NUM_HERO_BUDDIES_GAINED;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var hero = GameState.CurrentEntities[tagChange.Entity];
            if (hero == null)
            {
                return null;
            }

            // Add a safeguard to avoid duplicated info
            var heroCardId = hero.CardId;
            var heroes = GameState.CurrentEntities.Values
                .Where(entity => entity.CardId == heroCardId)
                .Where(entity => entity.GetTag(GameTag.BACON_PLAYER_NUM_HERO_BUDDIES_GAINED) >= tagChange.Value)
                .ToList();
            if (heroes.Count > 0)
            {
                return null;
            }

            // The value is set to 0 when rotating the entities it seems
            if (hero?.CardId != null && !hero.IsBaconBartender() && tagChange.Value >= 1)
            {
                return new List<GameEventProvider> {  GameEventProvider.Create(
                    tagChange.TimeStamp,
                    "BATTLEGROUNDS_BUDDY_GAINED",      
                    () => new GameEvent
                    {
                        Type = "BATTLEGROUNDS_BUDDY_GAINED",
                        Value = new
                        {
                            CardId = hero.CardId,
                            PlayerId = hero.GetTag(GameTag.PLAYER_ID, 0),
                            TotalBuddies = tagChange.Value,
                        }
                    },
               false,
               node) };
            }
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
