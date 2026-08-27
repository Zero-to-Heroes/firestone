#region

using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using HearthstoneReplays.Events;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using HearthstoneReplays.Parser.ReplayData.Meta;
using HearthstoneReplays.Parser.ReplayData.Meta.Options;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Enums;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;
using System.Collections;

#endregion

namespace HearthstoneReplays.Parser
{
    public enum StateType
    {
        GameState,
        PowerTaskList,
    }

    public class ParserState
    {
        public ParserState(StateType type, EventQueueHandler queueHandler, StateFacade stateFacade)
        {
            Logger.Log("Calling reset from ParserState constructor", type);
            this.StateType = type;
            this.StateFacade = stateFacade;
            this.NodeParser = new NodeParser(queueHandler, stateFacade, this.StateType);
        }

        public GameState GameState = new GameState();

        public NodeParser NodeParser;
        public StateFacade StateFacade;
        public HearthstoneReplay Replay { get; set; }
        public Game CurrentGame { get; set; }
        public GameData GameData { get; set; }
        public SendChoices SendChoices { get; set; }
        public Choices Choices { get; set; }
        public Options Options { get; set; }
        public Option CurrentOption { get; set; }
        public object LastOption { get; set; }
        public SubSpell CurrentSubSpell { get; set; }
        public int FirstPlayerEntityId { get; set; }
        public int CurrentPlayerId { get; set; }
        public ChosenEntities CurrentChosenEntites { get; set; }
        public bool Ended { get; set; }
        public int NumberOfCreates { get; set; }
        public bool ReconnectionOngoing { get; set; }
        public bool Spectating { get; set; }
        //public string FullLog { get; set; } = "";

        public StateType StateType { get; private set; }

        private Node _node;
        public Node Node
        {
            get { return _node; }
            set
            {
                if (value != _node)
                {
                    if (_node != null
                        // This works because Tag and TagChanges don't create new nodes
                        && (_node.Type == typeof(FullEntity)
                                || _node.Type == typeof(ShowEntity)
                                || _node.Type == typeof(ChangeEntity)
                    ))
                    {
                        EndAction();
                        if (_node.Type == typeof(ShowEntity))
                        {
                            GameState.ShowEntity(_node.Object as ShowEntity);
                        }
                        else if (_node.Type == typeof(FullEntity))
                        {
                            // In this case we just update the current state to whatever the game 
                            // tells us to
                            //if (ReconnectionOngoing)
                            //{
                            //    GameState.UpdateTagsForFullEntity(_node.Object as FullEntity);
                            //}
                            //else
                            //{
                            GameState.FullEntity(_node.Object as FullEntity, false);
                            //}
                        }
                        else if (_node.Type == typeof(ChangeEntity))
                        {
                            GameState.ChangeEntity(_node.Object as ChangeEntity);
                        }
                    }
                    if (_node != null && _node.Type == typeof(PlayerEntity))
                    {
                        NodeParser.CloseNode(_node, StateType);
                        GameState.PlayerEntity(_node.Object as PlayerEntity);
                    }
                    if (_node != null && _node.Type == typeof(GameEntity))
                    {
                        NodeParser.CloseNode(_node, StateType);
                        GameState.GameEntity(_node.Object as GameEntity);
                    }
                    if (_node != null && _node.Type == typeof(MetaData))
                    {
                        EndAction();
                    }
                    //HandleNodeUpdateEvent(_node, value);
                    this._node = value;
                }
            }
        }

        private Player _localPlayer;
        public Player LocalPlayer
        {
            get { return _localPlayer; }
        }

        public void SetLocalPlayer(Player value, DateTime timestamp, string data, bool sendEvent)
        {
            _localPlayer = value;
            value.IsMainPlayer = true;
            var players = getPlayers();
            var playerEntity = getPlayers().Find(player => player.PlayerId == value.PlayerId);
            playerEntity.IsMainPlayer = value.IsMainPlayer;
            if (sendEvent)
            {
                NodeParser.EnqueueGameEvent(new List<GameEventProvider> { GameEventProvider.Create(
                    timestamp,
                    "LOCAL_PLAYER",
                    () => new GameEvent
                    {
                        Type = "LOCAL_PLAYER",
                        Value = this._localPlayer
                    },
                    false,
                    new Node(null, null, 0, null, data)
            )});
            }
        }

        private Player _opponentPlayer;
        public Player OpponentPlayer
        {
            get { return _opponentPlayer; }
        }

        public void SetOpponentPlayer(Player value, DateTime timestamp, string data, bool sendEvent)
        {
            _opponentPlayer = value;
            value.IsMainPlayer = false;
            var playerEntity = getPlayers().Find(player => player.PlayerId == value.PlayerId);
            playerEntity.IsMainPlayer = value.IsMainPlayer;
            //var gameState = GameEvent.BuildGameState(this, StateFacade, GameState, null, null);
            if (sendEvent)
            {
                NodeParser.EnqueueGameEvent(new List<GameEventProvider> { GameEventProvider.Create(
                    timestamp,
                    "OPPONENT_PLAYER",
                    () => new GameEvent
                    {
                        Type = "OPPONENT_PLAYER",
                        Value = new {
                            OpponentPlayer = this._opponentPlayer,
                            //GameState = gameState,
                        }
                    },
                    false,
                    new Node(null, null, 0, null, data)
                )});
            }
        }

        public void Reset(StateFacade helper)
        {
            GameState.Reset(this);
            NodeParser.Reset(this, helper);
            Replay = new HearthstoneReplay();
            Replay.Games = new List<Game>();
            CurrentGame = new Game();
            this._localPlayer = null;
            this._opponentPlayer = null;
            // Prevent an EndAction from triggering
            _node = null;
            Node = null;
            GameData = null;
            SendChoices = null;
            Choices = null;
            Options = null;
            CurrentOption = null;
            LastOption = null;
            FirstPlayerEntityId = -1;
            CurrentPlayerId = -1;
            CurrentChosenEntites = null;
            Ended = false;
            ReconnectionOngoing = false;
            //FullLog = "";
            NumberOfCreates = 0;
            Logger.Log($"resetting game state, ended is now Ended={Ended}", this.StateType);

            _isBattlegrounds = null;
            _cachedPlayers = new List<PlayerEntity>();
        }

        public void PartialReset()
        {
            var gameEntity = CurrentGame.Data.Where(d => d is GameEntity).Select(d => d as GameEntity).FirstOrDefault();
            var playerEntities = getPlayers();
            var keysToKeep = new HashSet<int> { gameEntity.Id }; // Exemple : clés à conserver
            foreach (var player in playerEntities)
            {
                keysToKeep.Add(player.Id);
            }
            GameState.CurrentEntities = GameState.CurrentEntities
                .Where(kvp => keysToKeep.Contains(kvp.Key))
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
        }

        public void CreateNewNode(Node newNode)
        {
            NodeParser.NewNode(newNode, StateType);
        }

        public void EndAction()
        {
            var debug = Node.Type == typeof(FullEntity) && (Node.Object as FullEntity).Entity == 68;
            if (Node.Type != typeof(Game))
            {
                NodeParser.CloseNode(Node, StateType);
            }
        }

        public void EndCurrentGame()
        {
            Ended = true;
            Logger.Log($"Game Ended in type={StateType}", $"Ended={Ended}");
        }

        public void UpdateCurrentNode(params System.Type[] types)
        {
            while (Node?.Parent != null && types.All(x => x != Node.Type))
                Node = Node.Parent;
        }

        private List<PlayerEntity> _cachedPlayers = new List<PlayerEntity>();
        public List<PlayerEntity> getPlayers()
        {
            if (_cachedPlayers.Count > 0)
            {
                return _cachedPlayers;
            }
            List<PlayerEntity> players = new List<PlayerEntity>();
            var dataCopy = CurrentGame.Data.ToList();
            foreach (GameData x in dataCopy)
            {
                if (x is PlayerEntity) players.Add((PlayerEntity)x);
            }
            // Not yet, need further testing to make sure it doesn't break anything
            //if (players.Count > 0)
            //{
            //    _cachedPlayers = players;
            //}
            return players;
        }

        public PlayerEntity GetPlayerForController(int controllerId)
        {
            var players = getPlayers();
            foreach (var player in players)
            {
                if (player.PlayerId == controllerId) return player;
            }
            return null;
        }

        public void TryAssignLocalPlayer(DateTime timestamp, string data)
        {

            // In mercenaries, there are no HERO_ENTITY tags, because there are, well
            // no heroes.
            if (IsMercenaries())
            {
                if (getPlayers().Count == 3 && CurrentGame.ScenarioID == (int)ScenarioId.LETTUCE_PVP)
                {
                    CurrentGame.ScenarioID = (int)ScenarioId.LETTUCE_PVP_VS_AI;

                }
                
                var localPlayerPlayerId = -1;
                var opponentPlayerPlayerId = -1;

                // Doing things intelligently is very difficult, because of the "3-players" approach they have in the logs.
                // The way players are assigned seem to be consistent across games though, so it's in fact probably easier
                // to hard-code the mapping
                // Mercenaries PvE has 3 players. From what I've seen:
                // - The first player is the main player, but a "dummy" account? Maybe used to store mercs in some circumstances?
                // - The second player is the AI
                // - The third player is the "real" player account
                if (IsMercenariesPvE() && getPlayers().Count == 3)
                {
                    localPlayerPlayerId = getPlayers()[2].PlayerId;
                    opponentPlayerPlayerId = getPlayers()[1].PlayerId;
                }
                else
                {
                    // We assume that our heroes are always the first ones revealed
                    localPlayerPlayerId = CurrentGame
                        .FilterGameData(typeof(FullEntity))
                        .Where(d => d is FullEntity)
                        .Select(d => d as FullEntity)
                        .Where(d => d.GetTag(GameTag.LETTUCE_MERCENARY) == 1 && d.CardId?.Length > 0)
                        .FirstOrDefault()
                        ?.GetEffectiveController() ?? -1;
                    opponentPlayerPlayerId = CurrentGame
                        .FilterGameData(typeof(FullEntity))
                        .Where(d => d is FullEntity)
                        .Select(d => d as FullEntity)
                        // On PvE we know the CardId
                        .Where(d => d.GetTag(GameTag.LETTUCE_MERCENARY) == 1 && (d.CardId?.Length == 0 || d.GetZone() == (int)Zone.PLAY))
                        // When reconnecting, our own mercs can already be in play, so we need to make sure
                        // we're picking a different controller
                        .Where(d => d.GetEffectiveController() != localPlayerPlayerId)
                        .FirstOrDefault()
                        ?.GetEffectiveController() ?? -1;
                }

                foreach (PlayerEntity player in getPlayers())
                {
                    if (player.PlayerId == opponentPlayerPlayerId && data.Contains("PlayerID=" + opponentPlayerPlayerId))
                    {
                        var newPlayer = Player.from(player);
                        SetOpponentPlayer(newPlayer, timestamp, data, StateType == StateType.GameState);
                        return;
                    }
                    else if (player.PlayerId == localPlayerPlayerId && data.Contains("PlayerID=" + localPlayerPlayerId))
                    {
                        var newPlayer = Player.from(player);
                        FirstPlayerEntityId = player.Id;
                        SetLocalPlayer(newPlayer, timestamp, data, StateType == StateType.GameState);
                        return;
                    }

                }
                return;
            }

            // Only assign the local player once
            // For mercenaries this is a bit different, since we have 4 player ID assignments
            if (LocalPlayer != null && OpponentPlayer != null)
            {
                return;
            }

            // Names are not assigned right away, so wait until all the data is present to notify
            foreach (PlayerEntity player in getPlayers())
            {
                // SOme games against AI, eg Bob
                if (player.Name == null && player.AccountHi != "0")
                {
                    //Console.WriteLine("Player with no name: " + player);
                    return;
                }
                var playerEntityIdTag = player.Tags.Where(t => t.Name == (int)GameTag.HERO_ENTITY).First();
                if (playerEntityIdTag == null)
                {
                    return;
                }
            }

            //Console.WriteLine("Trying to assign local player");
            List<IEntityData> showEntities = CurrentGame.FilterGameData(typeof(ShowEntity))
                .Select(d => d as ShowEntity) // We need the HAND zone, because other effects can trigger before mulligan (like anomalies)
                .Where(d => d.GetZone() == (int)Zone.HAND)
                // Anomalies mess this up, as they trigger before mulligan, and are assigned first to a player
                // at random (apparenlty)
                //.Where(d => d.GetTag(GameTag.CREATOR) != GameState.GetGameEntity()?.Id)
                .Select(d => (IEntityData)d)
                .ToList();
            // Happens when facing Bob, or when reconnecting
            if (showEntities.Count == 0)
            {
                Logger.Log("No show entity, fallback to fullentity in hand", "");
                showEntities = CurrentGame
                    .FilterGameData(typeof(FullEntity))
                    .Select(d => d as FullEntity)
                    .Where(d => d.GetZone() == (int)Zone.HAND)
                    // Anomalies mess this up, as they trigger before mulligan, and are assigned first to a player
                    // at random (apparenlty)
                    .Where(d => d.GetTag(GameTag.CREATOR) != GameState.GetGameEntity()?.Id)
                    .Select(d => (IEntityData)d)
                    .ToList();
                if (showEntities.Count == 0)
                {
                    Logger.Log("No full entity in hand, fallback to fullentity", "");
                    showEntities = CurrentGame.FilterGameData(typeof(FullEntity)).Select(d => (IEntityData)d).ToList();
                }
            }
            foreach (IEntityData entity in showEntities)
            {
                if (entity.CardId != null && entity.CardId.Length > 0
                    && GetTag(entity.Tags, GameTag.CARDTYPE) != (int)CardType.ENCHANTMENT
                    // We do this because some cards are revealed when drawn (like Aranasi Bloodmother) and mess up with
                    // this logic
                    // We can't use zone=HAND here because of Battlegrounds
                    && GetTag(entity.Tags, GameTag.ZONE) != (int)Zone.DECK)
                {
                    int entityId = entity.Entity;
                    BaseEntity fullEntity = GetEntity(entityId);
                    int controllerId = fullEntity.GetEffectiveController();
                    //Console.WriteLine("Passed first step: " + entityId + ", " + fullEntity + ", " + controllerId);
                    foreach (PlayerEntity player in getPlayers())
                    {
                        if (player.GetEffectiveController() == controllerId)
                        {
                            var newPlayer = Player.from(player);
                            var playerEntityId = player.Tags.Where(t => t.Name == (int)GameTag.HERO_ENTITY).First().Value;
                            FullEntity playerEntity = CurrentGame.Data
                                .Where(d => d is FullEntity)
                                .Select(d => (FullEntity)d)
                                .Where(e => e.Id == playerEntityId)
                                .First();
                            newPlayer.CardID = playerEntity.CardId;
                            SetLocalPlayer(newPlayer, timestamp, data, StateType == StateType.GameState);
                        }
                    }
                    if (LocalPlayer != null)
                    {
                        foreach (PlayerEntity player in getPlayers())
                        {
                            if (player.Id == LocalPlayer.Id)
                            {
                                continue;
                            }
                            var newPlayer = Player.from(player);
                            var playerEntityId = player.Tags.Where(t => t.Name == (int)GameTag.HERO_ENTITY).First().Value;
                            FullEntity playerEntity = CurrentGame.Data
                                .Where(d => d is FullEntity)
                                .Select(d => (FullEntity)d)
                                .Where(e => e.Id == playerEntityId)
                                .First();
                            newPlayer.CardID = playerEntity.CardId;
                            SetOpponentPlayer(newPlayer, timestamp, data, StateType == StateType.GameState);
                        }
                        return;
                    }
                }
            }
            // Could not assign any player
            if (_localPlayer == null && _opponentPlayer == null)
            {
                Logger.Log("ERROR TO LOG: Could not assign local player " + data, string.Join(", ", getPlayers()?.Select(player => player.Name).ToList()));
            }
        }

        public int GetTag(List<Tag> tags, GameTag tag)
        {
            Tag ret = tags.FirstOrDefault(t => t.Name == (int)tag);
            return ret == null ? -1 : ret.Value;
        }

        public BaseEntity GetEntity(int id)
        {
            return CurrentGame.FilterGameData(typeof(FullEntity), typeof(PlayerEntity))
                .Select(data => (BaseEntity)data).ToList()
                .Where(e => e.Id == id)
                .FirstOrDefault();
        }

        private bool? _isBattlegrounds = null;
        public bool IsBattlegrounds()
        {
            if (_isBattlegrounds != null)
            {
                return this._isBattlegrounds.Value;
            }
            if (CurrentGame.GameType == -1)
            {
                return false;
            }
            this._isBattlegrounds = CurrentGame.GameType == (int)GameType.GT_BATTLEGROUNDS
                || CurrentGame.GameType == (int)GameType.GT_BATTLEGROUNDS_FRIENDLY
                || CurrentGame.GameType == (int)GameType.GT_BATTLEGROUNDS_DUO
                || CurrentGame.GameType == (int)GameType.GT_BATTLEGROUNDS_DUO_FRIENDLY;
            return this._isBattlegrounds.Value;
        }

        public bool IsBattlegroundsDuos()
        {
            return CurrentGame.GameType == (int)GameType.GT_BATTLEGROUNDS_DUO
                || CurrentGame.GameType == (int)GameType.GT_BATTLEGROUNDS_DUO_FRIENDLY;
        }

        public bool InRecruitPhase()
        {
            return GameState.GetGameEntity().GetTag(GameTag.BOARD_VISUAL_STATE) == 1;
        }

        public bool InCombatPhase()
        {
            return GameState.GetGameEntity().GetTag(GameTag.BOARD_VISUAL_STATE) == 2;
        }

        public bool IsMercenaries()
        {
            return IsMercenariesPvE() || new List<int>() {
                (int)GameType.GT_MERCENARIES_PVP,
            }.Contains(CurrentGame.GameType);
        }
        public bool IsMercenariesPvE()
        {
            return new List<int>() {
                (int)GameType.GT_MERCENARIES_AI_VS_AI,
                (int)GameType.GT_MERCENARIES_FRIENDLY,
                (int)GameType.GT_MERCENARIES_PVE,
                (int)GameType.GT_MERCENARIES_PVE_COOP,
            }.Contains(CurrentGame.GameType);
        }

        internal bool IsReconnecting(long gameSeedForCurrentLogs)
        {
            Logger.Log("Is reconnecting?", $"statType={StateType}, ended={Ended}, creates={NumberOfCreates}, spectating={Spectating}, gameSeed={CurrentGame?.GameSeed}, currentGameSeed={gameSeedForCurrentLogs}");
            return gameSeedForCurrentLogs != 0 
                && CurrentGame != null 
                && CurrentGame.GameSeed != 0 
                && CurrentGame.GameSeed == gameSeedForCurrentLogs;
            //return !Ended && NumberOfCreates >= 1 && !Spectating;
        }

        public void ClearActiveSubSpell()
        {
            var current = this.CurrentSubSpell;
            SubSpell parent = null;
            if (current?.Spell == null)
            {
                this.CurrentSubSpell = null;
            }
            while (current?.Spell != null)
            {
                parent = current;
                current = current.Spell;
            }
            if (parent != null)
            {
                parent.Spell = null;
            }
        }
    }
}