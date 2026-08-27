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
    public class BattlegroundsPlayerTechLevelUpdatedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public BattlegroundsPlayerTechLevelUpdatedParser(ParserState ParserState, StateFacade stateFacade)
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
                && (node.Object as TagChange).Name == (int)GameTag.PLAYER_TECH_LEVEL;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            // The arrival of spells introduced a change: now the tag_change can arrive during 
            // a discover, and so is considered as part of the ongoing action, even though the 
            // indentation in the power.log clearly indicate that it's not
            // But since there is no BLOCK_END, the parser has no way to know it's an independant
            // change
            //if (node.Parent != null && node.Parent.Type == typeof(Action))
            //{
            //    var parent = node.Parent.Object as Action;
            //    if (parent.Type == (int)BlockType.TRIGGER)
            //    {
            //        return null;
            //    }
            //}
            var hero = GameState.CurrentEntities[tagChange.Entity];
            if (hero == null)
            {
                return null;
            }

            // So we add a safeguard to avoid duplicated info
            var heroCardId = hero.CardId;
            var heroes = GameState.CurrentEntities.Values
                .Where(entity => entity.CardId == heroCardId)
                .Where(entity => entity.GetTag(GameTag.PLAYER_TECH_LEVEL) >= tagChange.Value)
                .ToList();

            if (heroes.Count > 0)
            {
                return null;
            }

            // The value is set to 0 when rotating the entities it seems
            if (hero?.CardId != null && !hero.IsBaconBartender() && !hero.IsBaconEnchantment()
                // Sometimes we have updates for the ghost, probably to indicate the initial tavern. We ignore them
                && !hero.IsBaconGhost() && tagChange.Value > 1)
            {
                var debug = hero.CardId == CardIds.TagtransferplayerenchantDntEnchantment_Bacon_TagTransferPlayerE;
                return new List<GameEventProvider> {  GameEventProvider.Create(
                   tagChange.TimeStamp,
                   "BATTLEGROUNDS_TAVERN_UPGRADE",
                   () => new GameEvent
                   {
                       Type = "BATTLEGROUNDS_TAVERN_UPGRADE",
                       Value = new
                       {
                           CardId = hero.CardId,
                           PlayerId = hero.GetTag(GameTag.PLAYER_ID),
                           TavernLevel = tagChange.Value,
                       }
                   },
                   false,
                   node
                )};
            }
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
