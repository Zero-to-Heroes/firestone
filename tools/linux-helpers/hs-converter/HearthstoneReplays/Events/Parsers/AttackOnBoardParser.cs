using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using System.Collections.Generic;
using System.Linq;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;

namespace HearthstoneReplays.Events.Parsers
{
    public class AttackOnBoardParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public AttackOnBoardParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && !StateFacade.IsBattlegrounds()
                && node.Type == typeof(TagChange)
                && ((node.Object as TagChange).Name == (int)GameTag.ATK);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && !StateFacade.IsBattlegrounds()
                && node.Type == typeof(Action);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity);
            if (entity?.GetZone() != (int)Zone.PLAY)
            {
                return null;
            }


            return new List<GameEventProvider> { GameEventProvider.Create(
                (node.Object as TagChange).TimeStamp,
                "TOTAL_ATTACK_ON_BOARD",
                () =>
                {
                    // Do it here, so that if the tag change is an ATK tag, it has already been processed
                    AttackOnBoard attackOnBoard = BuildAttackOnBoard();
                    if (attackOnBoard == null)
                    {
                        return null;
                    }
                    return new GameEvent
                    {
                        Type = "TOTAL_ATTACK_ON_BOARD",
                        Value = new
                        {
                            CardId = null as string,
                            ControllerId = -1,
                            LocalPlayer = null as Player,
                            OpponentPlayer = null as Player,
                            EntityId = -1,
                            AdditionalProps = new
                            {
                                AttackOnBoard = attackOnBoard,
                            }
                        }
                    };
                },
                true,
                node
            )};
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var action = node.Object as Action;
            if (action.Data.Count == 0)
            {
                return null;
            }

            AttackOnBoard attackOnBoard = BuildAttackOnBoard();
            if (attackOnBoard == null)
            {
                return null;
            }

            return new List<GameEventProvider> { GameEventProvider.Create(
                (node.Object as Action).TimeStamp,
                "TOTAL_ATTACK_ON_BOARD",
                GameEvent.CreateProvider(
                    "TOTAL_ATTACK_ON_BOARD",
                    null,
                    -1,
                    -1,
                    StateFacade,
                    new
                    {
                        AttackOnBoard = attackOnBoard,
                    }
                ),
                true,
                node
            )};
        }

        private AttackOnBoard BuildAttackOnBoard()
        {
            if (StateFacade?.LocalPlayer == null || StateFacade?.OpponentPlayer == null)
            {
                return null;
            }

            var allEntities = GameState.CurrentEntities.Values.ToList();
            return new AttackOnBoard()
            {
                Player = BuildAttackOnBoardForPlayer(
                    StateFacade.LocalPlayer.PlayerId,
                    GameState.CurrentEntities.GetValueOrDefault(StateFacade.LocalPlayer.Id),
                    allEntities),
                Opponent = BuildAttackOnBoardForPlayer(
                    StateFacade.OpponentPlayer.PlayerId,
                    GameState.CurrentEntities.GetValueOrDefault(StateFacade.OpponentPlayer.Id),
                    allEntities),
            };
        }

        private AttackOnBoardForPlayer BuildAttackOnBoardForPlayer(int playerId, FullEntity playerEntity, List<FullEntity> allEntities)
        {
            var entitiesForPlayer = allEntities.Where(e => e.IsInPlay() && e.GetEffectiveController() == playerId).ToList();
            var hero = entitiesForPlayer.FirstOrDefault(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO);
            var isActivePlayer = playerEntity.GetTag(GameTag.CURRENT_PLAYER) == 1;

            var sleeper = entitiesForPlayer.FirstOrDefault(e => e.CardId == "TOY_866");
            var debug = sleeper != null && sleeper.GetTag(GameTag.DORMANT) != 1 && isActivePlayer;
            // Board
            var entitiesOnBoardThatCanAttack = entitiesForPlayer
                .Where(e => e.IsMinionLike() && e.GetTag(GameTag.ATK) > 0 && CanAttack(e, isActivePlayer, false));
            //var debugEntities = entitiesOnBoardThatCanAttack.ToList();
            int totalAttackOnBoard = entitiesOnBoardThatCanAttack.Select(e => GetAttack(e)).Sum();

            // Hero
            int heroAttack = 0;
            if (hero != null)
            {
                var weapon = entitiesForPlayer.FirstOrDefault(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.WEAPON);
                if (weapon == null || weapon.GetTag(GameTag.CANNOT_ATTACK_HEROES) != 1)
                {
                    var baseHeroAttack = isActivePlayer ? hero.GetTag(GameTag.ATK, 0) : (weapon?.GetTag(GameTag.ATK, 0) ?? 0);
                    var windfuryMultiplier = GetWindfuryMultiplier(hero);
                    var attacksForWeapon = weapon == null
                        ? windfuryMultiplier
                        : Math.Max(0, weapon.GetTag(GameTag.HEALTH, 0) - weapon.GetTag(GameTag.DAMAGE, 0));
                    var maxAttacks = Math.Min(windfuryMultiplier, attacksForWeapon);
                    var rawAttacksLeft = maxAttacks - hero.GetTag(GameTag.NUM_ATTACKS_THIS_TURN, 0) + hero.GetTag(GameTag.EXTRA_ATTACKS_THIS_TURN, 0);
                    var attacksLeft = isActivePlayer
                        ? Math.Min(maxAttacks, rawAttacksLeft)
                        : windfuryMultiplier;
                    heroAttack = CanAttack(hero, isActivePlayer, true) ? attacksLeft * baseHeroAttack : 0;
                }
            }
            return new AttackOnBoardForPlayer()
            {
                Board = totalAttackOnBoard,
                Hero = heroAttack,
            };
        }

        private bool CanAttack(FullEntity e, bool isActivePlayer, bool isHero)
        {
            if (!isHero && e.HasTag(GameTag.CANNOT_ATTACK_HEROES))
            {
                return false;
            }

            var isDormant = e.HasTag(GameTag.DORMANT);
            var cantAttack = e.HasTag(GameTag.CANT_ATTACK);
            var isFrozen = e.HasTag(GameTag.FROZEN);
            var canTitanAttack = !e.HasTag(GameTag.TITAN)
                || (e.HasTag(GameTag.TITAN_ABILITY_USED_1) && e.HasTag(GameTag.TITAN_ABILITY_USED_2) && e.HasTag(GameTag.TITAN_ABILITY_USED_3));
            var canStarshipAttack = !e.HasTag(GameTag.STARSHIP)
                || (!e.HasTag(GameTag.LAUNCHPAD) && (!isActivePlayer || e.GetTag(GameTag.NUM_TURNS_IN_PLAY) > 1));
            var exhausted = e.HasTag(GameTag.EXHAUSTED) || e.GetTag(GameTag.NUM_TURNS_IN_PLAY, 0) == 0;
            var hasSummoningSickness =
                !isHero &&
                isActivePlayer &&
                !e.HasTag(GameTag.CHARGE) && !e.HasTag(GameTag.NON_KEYWORD_CHARGE)
                // e.HasTag(GameTag.JUST_PLAYED) || 
                // Removing the JUST_PLAYED, because Corridor Sleeper has is =1 after being waken up.
                // The NUM_TURNS_IN_PLAY check above should be enough to cover summoning sickness
                && (exhausted || e.HasTag(GameTag.ATTACKABLE_BY_RUSH));
            return !isDormant && !hasSummoningSickness && !isFrozen && !cantAttack && canTitanAttack && canStarshipAttack;
        }

        private int GetAttack(FullEntity e)
        {
            var windfuryMultiplier = GetWindfuryMultiplier(e);
            var availableAttacks = Math.Max(0, windfuryMultiplier - e.GetTag(GameTag.NUM_ATTACKS_THIS_TURN, 0) + e.GetTag(GameTag.EXTRA_ATTACKS_THIS_TURN, 0));
            // TODO: Neptulon
            var entityAttack = e.GetTag(GameTag.ATK, 0);
            return entityAttack * availableAttacks;
        }

        private int GetWindfuryMultiplier(FullEntity e)
        {
            return e.HasTag(GameTag.SILENCED)
                ? 1
                : e.HasTag(GameTag.MEGA_WINDFURY)
                ? 4
                : e.GetTag(GameTag.WINDFURY) == 3
                ? 4
                : e.HasTag(GameTag.WINDFURY)
                ? 2
                : 1;
        }
    }

    internal class AttackOnBoard
    {
        public AttackOnBoardForPlayer Player { get; set; }
        public AttackOnBoardForPlayer Opponent { get; set; }
    }

    internal class AttackOnBoardForPlayer
    {
        public int Board { get; set; }
        public int Hero { get; set; }
    }
}
