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
    public class BattlegroundsNextOpponnentParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }

        public BattlegroundsNextOpponnentParser(ParserState ParserState)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.NEXT_OPPONENT_PLAYER_ID;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            var isPlayerNode = node.Type == typeof(Player);
            return stateType == StateType.PowerTaskList
                && ((node.Type == typeof(PlayerEntity) && (node.Object as PlayerEntity).Tags.Find(tag => tag.Name == (int)GameTag.NEXT_OPPONENT_PLAYER_ID) != null)
                    || (node.Type == typeof(FullEntity) && (node.Object as FullEntity).Tags.Find(tag => tag.Name == (int)GameTag.NEXT_OPPONENT_PLAYER_ID) != null));
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var isInAction = node.Parent != null && node.Parent.Type == typeof(Action);
            // Only consider the tag changes that are at the root
            // This double tag change notif was introduced in a recent update (19.0 or 19.2). 
            // It can probably be useful if we're able to see for each player who their next opponent will be,
            // but for now since we only care about the main player we keep things simple
            // Except for the first turn, where the info is only sent in an action
            if (isInAction && (node.Parent.Object as Action).Entity != GameState.GetGameEntity()?.Entity)
            {
                return null;
            }

            var heroes = GameState.CurrentEntities.Values
                .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                .Where(entity => entity.GetTag(GameTag.PLAYER_ID) == tagChange.Value)
                .Where(entity => !entity.IsBaconBartender()
                    && !entity.IsBaconGhost()
                    && !entity.IsBaconEnchantment())
                .ToList();
            var hero = heroes == null || heroes.Count == 0 ? null : heroes[0];
            // Happens in some circumstances, though it's not clear for me which ones. Maybe
            // when the future opponent isn't here yet, or when players take too long to join?
            if (hero == null)
            {
                GameState.NextBgsOpponentPlayerId = tagChange.Value;
            }
            //Logger.Log("Next opponent player id", hero?.CardId);
            if (hero?.CardId != null && !hero.IsBaconBartender())
            {
                GameState.BgsHasSentNextOpponent = true;
                return new List<GameEventProvider> {
                    GameEventProvider.Create(
                        tagChange.TimeStamp,
                        "BATTLEGROUNDS_NEXT_OPPONENT",
                        () => new GameEvent
                        {
                            Type = "BATTLEGROUNDS_NEXT_OPPONENT",
                            Value = new
                            {
                                CardId = hero.CardId,
                                OpponentPlayerId = tagChange.Value
                            }
                        },
                        true,
                        node) 
                };
            }
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var tags = node.Type == typeof(PlayerEntity) ? (node.Object as PlayerEntity).Tags : (node.Object as FullEntity).Tags;
            var timestamp = node.Type == typeof(PlayerEntity) ? (node.Object as PlayerEntity).TimeStamp : (node.Object as FullEntity).TimeStamp;
            var nextOpponentPlayerId = tags.Find(tag => tag.Name == (int)GameTag.NEXT_OPPONENT_PLAYER_ID).Value;
            var heroes = GameState.CurrentEntities.Values
                .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                .Where(entity => entity.GetTag(GameTag.PLAYER_ID) == nextOpponentPlayerId)
                .Where(entity => !entity.IsBaconBartender()
                    && !entity.IsBaconGhost()
                    && !entity.IsBaconEnchantment())
                .ToList();
            var hero = heroes == null || heroes.Count == 0 ? null : heroes[0];
            GameState.NextBgsOpponentPlayerId = nextOpponentPlayerId;
            GameState.BgsHasSentNextOpponent = true;
            if (hero?.CardId != null && !hero.IsBaconBartender())
            {
                return new List<GameEventProvider> {
                    GameEventProvider.Create(
                        timestamp,
                        "BATTLEGROUNDS_NEXT_OPPONENT",
                        () => new GameEvent
                        {
                            Type = "BATTLEGROUNDS_NEXT_OPPONENT",
                            Value = new
                            {
                                CardId = hero.CardId,
                                OpponentPlayerId = nextOpponentPlayerId,
                            }
                        },
                        true,
                        node)
                };
            }
            return null;
            // Because the first player is handled differently than the rest, we kind of hack our way
            // there
            //GameState.NextBgsOpponentPlayerId = nextOpponentPlayerId;
            //GameState.BgsHasSentNextOpponent = true;
            // This is also how the next opponent is conveyed when reconnecting (sometimes), so
            // we need to emit an event here
        }
    }
}
