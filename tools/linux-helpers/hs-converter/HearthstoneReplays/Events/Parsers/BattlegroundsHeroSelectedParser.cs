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
    public class BattlegroundsHeroSelectedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public BattlegroundsHeroSelectedParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            // Because choices are not handled properly in PTL
            return stateType == StateType.GameState
                && StateFacade.IsBattlegrounds()
                && node.Type == typeof(Choice)
                && ParserState.CurrentChosenEntites != null;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            // Don't check for BG here, in case of reconnect
            // In some cases (starting the app late? Reconnect?) we don't realize it's a reconnect
            // However, in BG we should never have a FullEntity, whose controller is the player, 
            // unless it's a HERO_SELECTED event
            FullEntity fullEntity = null;
            return stateType == StateType.PowerTaskList
                && StateFacade.IsBattlegrounds()
                // When the hero is created during the battle prep
                && GameState.GetGameEntity()?.GetTag(GameTag.BG_BATTLE_STARTING) != 1
                && node.Type == typeof(FullEntity)
                && (fullEntity = node.Object as FullEntity).GetTag(GameTag.CARDTYPE) == (int)CardType.HERO
                && fullEntity.GetTag(GameTag.ZONE) == (int)Zone.PLAY
                // For Aranna / Azshara
                && fullEntity.GetTag(GameTag.REPLACEMENT_ENTITY) != 1
                // When swapping teammates in a Duos fight
                && !(fullEntity.SubSpellInEffect?.Prefab?.StartsWith("ReuseFX_Generic_OverrideSpawn_FromPortal_Super_Random_SuppressPlaySounds") ?? false);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var choice = node.Object as Choice;
            var chosenEntity = GameState.CurrentEntities[choice.Entity];
            if (chosenEntity == null || chosenEntity.GetTag(GameTag.CARDTYPE) != (int)CardType.HERO)
            {
                return null;
            }
            // Heroes proposed at the start are in hand, as opposed to heroes discovered by 
            // Lord Barov's hero power
            if (chosenEntity.GetTag(GameTag.ZONE) != (int)Zone.HAND)
            {
                return null;
            }

            if (chosenEntity.IsBaconEnchantment())
            {
                return null;
            }

            var controllerId = chosenEntity.GetEffectiveController();
            var playerEntity = GameState.GetController(controllerId);
            var nextOpponentPlayerId = playerEntity.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID, 0);

            return new List<GameEventProvider> { GameEventProvider.Create(
                choice.TimeStamp,
                "BATTLEGROUNDS_HERO_SELECTED",
                () => {
                    if (!StateFacade.IsBattlegrounds())
                    {
                        return null;
                    }
                    if (controllerId != (int)StateFacade.LocalPlayer.PlayerId)
                    {
                        return null;
                    }

                    return new GameEvent
                    {
                        Type = "BATTLEGROUNDS_HERO_SELECTED",
                        Value = new
                        {
                            CardId = chosenEntity.CardId,
                            LocalPlayer = StateFacade.LocalPlayer,
                            OpponentPlayer = StateFacade.OpponentPlayer,
                            Health = chosenEntity.GetTag(GameTag.HEALTH),
                            Armor = chosenEntity.GetTag(GameTag.ARMOR, 0),
                            NextOpponentPlayerId = nextOpponentPlayerId,
                        }
                    };
                },
                true,
                node)
            };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var fullEntity = node.Object as FullEntity;
            return new List<GameEventProvider> { GameEventProvider.Create(
                fullEntity.TimeStamp,
                "BATTLEGROUNDS_HERO_SELECTED",
                () => BuildGameEvent(node),
                true,
                node)
            };
        }

        private GameEvent BuildGameEvent(Node node)
        {
            var fullEntity = node.Object as FullEntity;
            if (!StateFacade.IsBattlegrounds())
            {
                return null;
            }

            if (fullEntity.GetEffectiveController() != StateFacade.LocalPlayer.PlayerId)
            {
                return null;
            }


            if (fullEntity.IsBaconEnchantment())
            {
                return null;
            }

            var nextOpponentPlayerId = fullEntity.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID);
            var heroes = GameState.CurrentEntities.Values.ToList()
                .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                .Where(entity => entity.GetTag(GameTag.PLAYER_ID) == nextOpponentPlayerId)
                .Where(entity => !entity.IsBaconBartender()
                    && !entity.IsBaconGhost())
                .ToList();
            var hero = heroes == null || heroes.Count == 0 ? null : heroes[0];
            // Happens in some circumstances, though it's not clear for me which ones. Maybe
            // when the future opponent isn't here yet, or when players take too long to join?
            if (hero == null)
            {
                GameState.NextBgsOpponentPlayerId = nextOpponentPlayerId;
            }

            return new GameEvent
            {
                Type = "BATTLEGROUNDS_HERO_SELECTED",
                Value = new
                {
                    CardId = fullEntity.CardId,
                    LocalPlayer = StateFacade.LocalPlayer,
                    OpponentPlayer = StateFacade.OpponentPlayer,
                    LeaderboardPlace = fullEntity.GetLeaderboardPosition((GameType)StateFacade.GetMetaData().GameType),
                    Health = fullEntity.GetTag(GameTag.HEALTH),
                    Armor = fullEntity.GetTag(GameTag.ARMOR, 0),
                    Damage = fullEntity.GetTag(GameTag.DAMAGE),
                    TavernLevel = fullEntity.GetTag(GameTag.PLAYER_TECH_LEVEL),
                    NextOpponentCardId = hero?.CardId,
                    NextOpponentPlayerId = nextOpponentPlayerId,
                },
            };
        }
    }
}