#region

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using Type = System.Type;

#endregion

namespace HearthstoneReplays.Parser
{
    public class Helper
    {
        public static readonly List<string> innkeeperNames = new List<string>() { "The Innkeeper", "Aubergiste", "Gastwirt",
            "El tabernero", "Locandiere", "酒場のオヤジ", "여관주인",  "Karczmarz", "O Estalajadeiro", "Хозяин таверны",
            "เจ้าของโรงแรม", "旅店老板", "旅店老闆" };
        public static readonly List<string> bobTavernNames = new List<string>() { "Bartender Bob", "Bob's Tavern", "Bobs Gasthaus", "Taberna de Bob",
            "Taverne de Bob", "Locanda di Bob", "ボブの酒場", "밥의 선술집", "Karczma Boba", "Taverna do Bob", "Таверна Боба",
            "โรงเตี๊ยมของบ็อบ", "鲍勃的酒馆", "鮑伯的旅店"};
        public static readonly List<string> mercBotNames = new List<string>() { "QuirkyTurtle", "CrazyCat", "华丽之虎", "隱祕束褲" };

        private readonly Dictionary<GameTag, Type> TagTypes = new Dictionary<GameTag, Type>
        {
            {GameTag.CARDTYPE, typeof(CardType)},
            {GameTag.CLASS, typeof(CardClass)},
            {GameTag.FACTION, typeof(Faction)},
            {GameTag.PLAYSTATE, typeof(PlayState)},
            {GameTag.RARITY, typeof(Rarity)},
            {GameTag.MULLIGAN_STATE, typeof(Mulligan)},
            {GameTag.NEXT_STEP, typeof(Step)},
            {GameTag.STATE, typeof(State)},
            {GameTag.STEP, typeof(Step)},
            {GameTag.CARDRACE, typeof(Race)},
            {GameTag.ZONE, typeof(Zone)}
        };

        private CombinedState State { get; set; }

        public Helper(CombinedState state)
        {
            this.State = state;
        }

        public int ParseEntity(string data)
        {
            if (string.IsNullOrEmpty(data))
                return 0;
            // Early check: EntityRegex looks for "[...id=(\d+)...]", so check for "id=" and "["
            Match match = null;
            if (data.Contains("id=") && data.Contains("["))
            {
                match = Regexes.EntityRegex.Match(data);
            }
            if (match != null && match.Success)
                return int.Parse(match.Groups[1].Value);
            if (data == "GameEntity")
                return State.GSState.CurrentGame.Data.Where(d => d is GameEntity).Select(d => d as GameEntity).FirstOrDefault().Id;
            int numeric;
            if (int.TryParse(data, out numeric))
                return numeric;
            return GetPlayerIdFromName(data);
        }

        private static readonly Dictionary<string, int> _playerIdCache = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        public void NewGame()
        {
            _playerIdCache.Clear();
        }

        public int GetPlayerIdFromName(string data)
        {
            if (_playerIdCache.TryGetValue(data, out var cachedId))
            {
                return cachedId;
            }

            var state = State.GSState;

            var validPlayers = state.CurrentGame.Data.Where(x => (x is PlayerEntity)).Select(d => d as PlayerEntity).ToList();
            var initialValidPlayers = validPlayers.ToList();
            var grouped = validPlayers.GroupBy(p => p.Name).ToList();
            // In mercs, the situation is weird, as we can have something like this
            // PlayerID = 1, PlayerName = Seniorheld
            // PlayerID = 2, PlayerName = Seniorheld
            // PlayerID = 3, PlayerName = ShadowWalker#2116
            // PlayerID = 4, PlayerName = UNKNOWN HUMAN PLAYER
            // In that case, when the logs reference "Seniorhelf", we have no way to know who it applies to
            // so when dealing with mercs, if we face a name without a btag, we ignore if
            foreach (var group in grouped)
            {
                if (group.Count() > 1)
                {
                    validPlayers = validPlayers.Where(p => p.Name != group.Key).ToList();
                }
            }
            // In PvE, we only have the active player + twice the AI
            if (validPlayers.Count < 2)
            {
                validPlayers = initialValidPlayers;
            }

            var firstPlayer = validPlayers.FirstOrDefault(x => x.Id == state.FirstPlayerEntityId)
                ?? throw new Exception("Could not find first player " + data);

            var secondPlayer = validPlayers.FirstOrDefault(x => x.Id != state.FirstPlayerEntityId)
                ?? throw new Exception("Could not find second player " + data);

            int result = -1;

            if (firstPlayer.Name == data)
            {
                result = firstPlayer.Id;
            }
            else if (secondPlayer.Name == data)
            {
                result = secondPlayer.Id;
            }
            else if (string.IsNullOrEmpty(firstPlayer.Name))
            {
                if (firstPlayer.AccountHi == "0" && firstPlayer.AccountLo == "0" && State.GSState.IsBattlegrounds())
                {
                    firstPlayer.Name = "Bartender Bob";
                }
                else
                {
                    firstPlayer.Name = data;
                }
                firstPlayer.InitialName = innkeeperNames.Contains(data)
                    ? innkeeperNames[0]
                    : bobTavernNames.Contains(data)
                    ? bobTavernNames[0]
                    : mercBotNames.Contains(data)
                    ? mercBotNames[0]
                    : data;
                result = firstPlayer.Id;
            }
            // Sometimes we register the player name with the full battletag, 
            // and get only the short name afterwards
            else if (firstPlayer.Name.IndexOf(data) != -1)
            {
                result = firstPlayer.Id;
            }
            else if (data != null && data.IndexOf(firstPlayer.Name) != -1)
            {
                result = firstPlayer.Id;
            }
            else if (string.IsNullOrEmpty(secondPlayer.Name))
            {
                secondPlayer.Name = data;
                secondPlayer.InitialName = innkeeperNames.Contains(data)
                    ? innkeeperNames[0]
                    : bobTavernNames.Contains(data)
                    ? bobTavernNames[0]
                    : mercBotNames.Contains(data)
                    ? mercBotNames[0]
                    : data;
                result = secondPlayer.Id;
            }
            // And the opposite
            else if (secondPlayer.Name.IndexOf(data) != -1)
            {
                result = secondPlayer.Id;
            }
            else if (data != null && data.IndexOf(secondPlayer.Name) != -1)
            {
                result = secondPlayer.Id;
            }
            // Because there are 3 players in mercenaries, and we hardcode the player names for now
            // so this case should never happen in that mode
            // If we leave it like that, it will assign the player name to the first Innkeeper. This is 
            // somewhat ok, because the first innkeeper seems to be the player themselves, but then it 
            // creates wrong assignments to player IDs
            else if ((firstPlayer.Name == "UNKNOWN HUMAN PLAYER"
                || innkeeperNames.Select(x => x.ToLower()).Contains(firstPlayer.Name.ToLower())
                || innkeeperNames.Select(x => x.ToLower()).Contains(firstPlayer.InitialName.ToLower())
                || bobTavernNames.Select(x => x.ToLower()).Contains(firstPlayer.Name.ToLower())
                || bobTavernNames.Select(x => x.ToLower()).Contains(firstPlayer.InitialName.ToLower()))
                || mercBotNames.Select(x => x.ToLower()).Contains(firstPlayer.Name.ToLower())
                || mercBotNames.Select(x => x.ToLower()).Contains(firstPlayer.InitialName.ToLower()))
            {
                firstPlayer.Name = data;
                result = firstPlayer.Id;
            }
            else if ((secondPlayer.Name == "UNKNOWN HUMAN PLAYER"
                || innkeeperNames.Select(x => x.ToLower()).Contains(secondPlayer.Name.ToLower())
                || innkeeperNames.Select(x => x.ToLower()).Contains(secondPlayer.InitialName.ToLower())
                || bobTavernNames.Select(x => x.ToLower()).Contains(secondPlayer.Name.ToLower())
                || bobTavernNames.Select(x => x.ToLower()).Contains(secondPlayer.InitialName.ToLower()))
                || mercBotNames.Select(x => x.ToLower()).Contains(secondPlayer.Name.ToLower())
                || mercBotNames.Select(x => x.ToLower()).Contains(secondPlayer.InitialName.ToLower()))
            {
                secondPlayer.Name = data;
                result = secondPlayer.Id;
            }
            else
            {
                // Case where the entity itself is replaced by a new hero, like in the Crooked Pete / Beastly Pete case
                var idFromState = State.GSState.GameState.PlayerIdFromEntityName(data);
                if (idFromState != 0)
                {
                    result = idFromState;
                }
                // Fringe case, but I saw it happen from time to time
                // We assume this happens in a game vs AI, so the human player is always the first
                // and if that's not the case, then we have no way to know which unknown human player this is
                else if (data == "UNKNOWN HUMAN PLAYER")
                {
                    result = firstPlayer.Id;
                }
                // In BG, it happens (under what circumstances?) that the current opponent's name is shown instead of 
                // the generic Bartender Bob name.
                // Eg BLOCK_START BlockType=TRIGGER Entity=dobroeytro EffectCardId=System.Collections.Generic.List`1[System.String] EffectIndex=-1 Target=0 SubOption=-1 TriggerKeyword=TAG_NOT_SET
                // Sometimes, this is even the first time we even see this name
                // In this case, we default to the Bartender Bob entity
                else if (State.GSState.IsBattlegrounds())
                {
                    //Logger.Log("Could not find player for " + data, "Defaulting to Bartender Bob instead of crashing");
                    var bob = firstPlayer.AccountHi == "0" ? firstPlayer : secondPlayer.AccountHi == "0" ? secondPlayer : null;
                    if (bob != null)
                    {
                        result = bob.Id;
                    }
                }
            }

            if (result == -1)
            {
                throw new Exception("Could not get id from player name: " + data
                    + " // " + firstPlayer.Name + " // " + firstPlayer.InitialName + " // " + secondPlayer.Name + " // " + secondPlayer.InitialName);
            }

            _playerIdCache[data] = result;
            return result;
        }

        public void setName(ParserState state, int playerId, String playerName)
        {
            List<PlayerEntity> players = state.getPlayers();
            String oldName = null;
            foreach (PlayerEntity entity in players)
            {
                if (entity.PlayerId == playerId && playerName != entity.Name)
                {
                    oldName = entity.Name;
                    entity.Name = playerName;
                }
            }

            foreach (PlayerEntity entity in players)
            {
                if (entity.PlayerId != playerId)
                {
                    if (playerName == entity.Name)
                    {
                        entity.Name = null;
                    }
                    else if (oldName != null)
                    {
                        entity.Name = oldName;
                    }
                }
            }
        }

        public Tag ParseTag(string tagName, string value)
        {
            Type tagType;
            int tagValue;

            var tag = new Tag();
            tag.Name = ParseEnum<GameTag>(tagName);

            if (TagTypes.TryGetValue((GameTag)tag.Name, out tagType))
                tag.Value = ParseEnum(tagType, value);
            else if (int.TryParse(value, out tagValue))
                tag.Value = tagValue;
            else
                throw new Exception(string.Format("Unhandled tag value: {0}={1}", tagName, value));
            return tag;
        }

        private static readonly Dictionary<Type, Dictionary<string, int>> EnumCache = new Dictionary<Type, Dictionary<string, int>>();

        public int ParseEnum(Type type, string tag)
        {
            if (!EnumCache.ContainsKey(type))
            {
                var names = type.GetEnumNames();
                var values = type.GetEnumValues();
                var nameValueDict = new Dictionary<string, int>();

                for (int i = 0; i < names.Length; i++)
                {
                    nameValueDict[names[i]] = (int)values.GetValue(i);
                }

                EnumCache[type] = nameValueDict;
            }

            if (EnumCache[type].TryGetValue(tag, out int value))
            {
                return value;
            }

            if (int.TryParse(tag, out value))
            {
                return value;
            }

            //Logger.Log("Error: enum not found", tag);
            //throw new Exception("Enum not found: " + tag);
            return -1;
        }

        public int ParseEnum<T>(string tag)
        {
            return ParseEnum(typeof(T), tag);
        }
    }
}