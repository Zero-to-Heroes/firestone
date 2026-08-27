using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System.Linq;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using static HearthstoneReplays.Events.CardIds;
using System;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using HearthstoneReplays.Parser.ReplayData.Meta;
using HearthstoneReplays.Parser.ReplayData;

namespace HearthstoneReplays.Events.Parsers
{
    public class BattlegroundsTrinketSelectedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public BattlegroundsTrinketSelectedParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            TagChange tagChange = null;
            return stateType == StateType.PowerTaskList
                && StateFacade.IsBattlegrounds()
                && node.Type == typeof(TagChange)
                && ((tagChange = node.Object as TagChange).Name == (int)GameTag.BACON_FIRST_TRINKET_DATABASE_ID
                    || tagChange.Name == (int)GameTag.BACON_SECOND_TRINKET_DATABASE_ID);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var hero = GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity);
            // The value is set to 0 when rotating the entities it seems
            if (hero?.CardId != null && !hero.IsBaconBartender() && tagChange.Value > 0)
            {
                return new List<GameEventProvider> {  GameEventProvider.Create(
                   tagChange.TimeStamp,
                    "BATTLEGROUNDS_TRINKET_SELECTED",
                   () => new GameEvent
                   {
                       Type = "BATTLEGROUNDS_TRINKET_SELECTED",
                       Value = new
                       {
                           CardId = hero.CardId,
                           PlayerId = hero.GetTag(GameTag.PLAYER_ID),
                           AdditionalProps = new
                           {
                               HeroCardId = hero.CardId,
                               TrinketDbfId = tagChange.Value,
                               IsFirstTrinket = tagChange.Name == (int)GameTag.BACON_FIRST_TRINKET_DATABASE_ID
                           }
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