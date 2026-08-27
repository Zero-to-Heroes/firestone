// ReSharper disable StringLiteralTypo
namespace HackF5.UnitySpy.HearthstoneLib.Detail.Battlegrounds
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    internal static class BattlegroundsInfoReader
    {
        public static string ReadSelectedGameMode(HearthstoneImage image)
        {
            var service = image.GetService("BaconLobbyMgr");
            return service?["m_selectedBattlegroundsGameMode"];
        }

        public static BattlegroundsInfo ReadBattlegroundsInfo(HearthstoneImage image)
        {
            var battlegroundsInfo = new BattlegroundsInfo();

            var playersList = new List<BattlegroundsPlayer>();
            try
            {
                var leaderboardMgr = image["PlayerLeaderboardManager"]?["s_instance"];
                // Also m_incomingHistory

                dynamic[] playerTiles = GetPlayerTiles(leaderboardMgr);
                var numberOfPlayerTiles = playerTiles?.Length ?? 0;
                var playerIdToCardIdMapping = new Dictionary<int, string>();
                var playerTileToIdMapping = new Dictionary<int, int>();
                for (int i = 0; i < numberOfPlayerTiles; i++)
                {
                    var playerTile = playerTiles[i];
                    //var playerIdTagIndex = -1;
                    // Resolve the entity and tag container once: re-walking the m_entity -> m_tags -> m_values
                    // chain (and re-materializing _entries) per tag is O(tags^2) live memory reads.
                    var entity = playerTile["m_entity"];
                    var tagValues = entity?["m_tags"]?["m_values"];
                    var numberOfTags = tagValues?["_count"] ?? 0;
                    var tagEntries = numberOfTags > 0 ? (object[])tagValues["_entries"] : null;
                    var playerId = -1;
                    for (int j = 0; j < numberOfTags; j++)
                    {
                        // Strongly typed access: skips the DLR dispatch of the dynamic indexer per tag.
                        if (tagEntries[j] is IManagedObjectInstance tagEntry
                            && tagEntry.GetValue<int>("key") == 30)
                        {
                            playerId = tagEntry.GetValue<int>("value");
                        }
                    }
                    // Info not available until the player mouses over the tile in the leaderboard, and there is no other way to get it from memory
                    //int triplesCount = playerTile["m_recentCombatsPanel"]?["m_triplesCount"] ?? -1;
                    string playerCardId = entity?["m_cardIdInternal"];
                    if (!playerIdToCardIdMapping.ContainsKey(playerId))
                    {
                        playerIdToCardIdMapping.Add(playerId, playerCardId);
                    }
                    if (!playerTileToIdMapping.ContainsKey(i))
                    {
                        playerTileToIdMapping.Add(i, playerId);
                    }
                }


                var combatHistory = leaderboardMgr?["m_combatHistory"];
                // Hoisted out of the per-tile loop: each indexer access re-reads the whole backing array
                // from process memory, so reading them once turns O(tiles * entries) reads into O(entries).
                var combatHistoryCount = combatHistory?["count"] ?? 0;
                var combatHistoryKeys = combatHistoryCount > 0 ? combatHistory["keySlots"] : null;
                var combatHistoryValues = combatHistoryCount > 0 ? combatHistory["valueSlots"] : null;
                for (int i = 0; i < numberOfPlayerTiles; i++)
                {
                    var playerId = playerTileToIdMapping[i];
                    var playerTile = playerTiles[i];
                    // Info not available until the player mouses over the tile in the leaderboard, and there is no other way to get it
                    string playerName = playerTile["m_overlay"]?["m_heroActor"]?["m_playerNameText"]?["m_Text"];
                    // Resolve m_entity once instead of once per field read.
                    var tileEntity = playerTile["m_entity"];
                    int playerHealth = tileEntity?["m_realTimeHealth"] ?? -1;
                    int playerDamage = tileEntity?["m_realTimeDamage"] ?? -1;
                    int playerArmor = tileEntity?["m_realTimeArmor"] ?? 0;
                    int leaderboardPosition = tileEntity?["m_realTimePlayerLeaderboardPlace"] ?? -1;
                    int linkedEntityId = tileEntity?["m_realTimeLinkedEntityId"] ?? -1;
                    int techLevel = tileEntity?["m_realTimePlayerTechLevel"] ?? -1;
                    var recentCombatPanel = GetRecentCombatsPanel(playerTile);
                    int triplesCount = recentCombatPanel?["m_triplesCount"] ?? -1;

                    //int winStreak = recentCombatPanel?["m_winStreakCount"] ?? -1;
                    var playerCombatHistoryIndex = -1;
                    for (var j = 0; j < combatHistoryCount; j++)
                    {
                        if (combatHistoryKeys[j] == playerId)
                        {
                            playerCombatHistoryIndex = j;
                            break;
                        }
                    }
                    var currentWinStreak = 0;
                    var battles = new List<IBgsBattleHistory>();
                    if (playerCombatHistoryIndex >= 0)
                    {
                        var playerCombatHistory = combatHistoryValues[playerCombatHistoryIndex];
                        var numberOfBattles = playerCombatHistory["_size"];
                        var memBattles = playerCombatHistory["_items"];
                        currentWinStreak = memBattles?[numberOfBattles - 1]?["winStreak"];
                        for (var j = 0; j < numberOfBattles; j++)
                        {
                            var memBattle = memBattles[j];
                            string ownerCardId = null;
                            string opponentCardId = null;
                            var ownerPlayerId = memBattle["ownerId"];
                            var opponentPlayerId = memBattle["opponentId"];
                            try
                            {
                                ownerCardId = ownerPlayerId == 0 ? null : playerIdToCardIdMapping[ownerPlayerId];
                                opponentCardId = opponentPlayerId == 0 ? null : playerIdToCardIdMapping[opponentPlayerId];
                            }
                            catch (Exception e)
                            {
                                Logger.Log($"Could not get mapping for player {playerId} and ownerPlayerId {ownerPlayerId} and opponentPlayerId {opponentPlayerId} " +
                                    "with message {e.Message} and trace " + e.StackTrace);
                                Logger.Log("Mapping is " + string.Join(Environment.NewLine, playerIdToCardIdMapping));
                            }
                            var battle = new BgsBattleHistory()
                            {
                                OwnerCardId = ownerCardId,
                                OpponentCardId = opponentCardId,
                                Damage = memBattle["damage"],
                                IsDefeated = memBattle["isDefeated"],
                            };
                            battles.Add(battle);
                        }
                    }

                    // m_raceCounts is dangerous: it gives the exact race count for the board, so more info than what is available in game
                    var raceCounts = GetRaceCounts(playerTile);
                    var numberOfRaces = raceCounts?["count"] ?? 0;
                    // Hoisted out of the loop: each indexer access re-reads the whole array.
                    var raceKeys = numberOfRaces > 0 ? raceCounts["keySlots"] : null;
                    var raceValues = numberOfRaces > 0 ? raceCounts["valueSlots"] : null;
                    var highestNumber = 0;
                    int highestRace = 0;
                    for (var j = 0; j < numberOfRaces; j++)
                    {
                        var race = raceKeys[j];
                        var number = raceValues[j];
                        if (number == highestNumber)
                        {
                            highestRace = 0;
                        }
                        else if (number > highestNumber)
                        {
                            highestNumber = number;
                            highestRace = race;
                        }
                    }

                    int boardCompositionRace = highestRace; // playerTile["m_recentCombatsPanel"]?["m_singleTribeWithCountName"]?["m_Text"];
                    int boardCompositionNumber = highestNumber; // int.Parse(playerTile["m_recentCombatsPanel"]?["m_singleTribeWithCountNumber"]?["m_Text"] ?? "-1");

                    //var recentCombatHistory = playerTile["m_recentCombatsPanel"]?["m_recentCombatEntries"]?["m_list"];
                    //var numberOfRecentCombatHistory = recentCombatHistory?["_size"] ?? 0;
                    //for (var j = 0; j < numberOfRecentCombatHistory; j++)
                    //{
                    //    var combatEntry = recentCombatHistory["_items"]?[j];
                    //    var opponentId = combatEntry["m_opponentId"];
                    //    var ownerId = combatEntry["m_ownerId"];
                    //    var damage = combatEntry["m_splatAmount"];
                    //}
                    var player = new BattlegroundsPlayer
                    {
                        Id = playerId,
                        EntityId = linkedEntityId,
                        Name = playerName,
                        CardId = playerIdToCardIdMapping[playerId],
                        MaxHealth = playerHealth,
                        Armor = playerArmor,
                        Damage = playerDamage,
                        LeaderboardPosition = leaderboardPosition,
                        BoardCompositionRace = boardCompositionRace,
                        BoardCompositionCount = boardCompositionNumber,
                        TriplesCount = triplesCount,
                        TechLevel = techLevel,
                        WinStreak = currentWinStreak,
                        Battles = battles,
                    };
                    playersList.Add(player);
                }
            }
            catch (Exception e)
            {
                Logger.Log("Could not get players list " + e.Message + " with trace " + e.StackTrace);
                if (Utils.IsMemoryReadingIssue(e))
                {
                    Logger.Log("Memory reading issue, throwing exception");
                    throw;
                }
            }


            var gameState = image["GameState"]?["s_instance"];
            List<int> races = new List<int>();
            var racesContainer = gameState?["m_availableRacesInBattlegroundsExcludingAmalgam"];
            if (racesContainer != null)
            {
                var numberOfRacesInGame = racesContainer["_size"];
                var raceItems = racesContainer["_items"];
                for (var i = 0; i < numberOfRacesInGame; i++)
                {
                    races.Add(raceItems[i]);
                }
            }

            battlegroundsInfo.Game = new BattlegroundsGame
            {
                Players = playersList,
                AvailableRaces = races,
            };

            var netCacheValues = image.GetService("NetCache")?["m_netCache"]?["valueSlots"];
            if (netCacheValues != null)
            {
                foreach (var netCache in netCacheValues)
                {
                    if (netCache?.TypeDefinition.Name == "NetCacheBaconRatingInfo")
                    {
                        battlegroundsInfo.Rating = netCache["<Rating>k__BackingField"] ?? -1;
                        battlegroundsInfo.DuosRating = netCache["<DuosRating>k__BackingField"] ?? -1;
                    }
                }
            }

            battlegroundsInfo.NewRating = ReadNewRating(image);

            return battlegroundsInfo;
        }

        private static dynamic GetRaceCounts(dynamic playerTile)
        {
            try
            {
                return playerTile["m_overlay"]["m_raceCounts"];
            }
            catch (Exception e)
            {
                return playerTile["m_raceCounts"];
            }
        }

        private static dynamic GetRecentCombatsPanel(dynamic playerTile)
        {
            try
            {
                return playerTile["m_overlay"]["m_recentCombatsPanel"];
            }
            catch (Exception e)
            {
                return playerTile["m_recentCombatsPanel"];
            }
        }

        private static dynamic[] GetPlayerTiles(dynamic leaderboardMgr)
        {
            try
            {
                return leaderboardMgr?["m_playerTiles"]?["_items"];
            }
            catch (Exception e)
            {
                var result = new List<dynamic>();
                var teams = leaderboardMgr["m_teams"]?["_items"];
                foreach (var team in teams)
                {
                    if (team == null)
                    {
                        continue;
                    }

                    var tiles = team["m_playerLeaderboardCards"]?["_items"];
                    foreach (var tile in tiles)
                    {
                        result.Add(tile);
                    }
                }
                return result.ToArray();
            }
        }

        public static int ReadNewRating(HearthstoneImage image)
        {
            try
            {
                // When playing a non-BG game, we get an exception. Not best, but since it's invoked only sporadically, it's probablyok
                return image["GameState"]
                    ?["s_instance"]
                    ?["m_gameEntity"]
                    ?["<RatingChangeData>k__BackingField"]
                    ?["_NewRating"] ?? -1;
            }
            catch (Exception e)
            {
                // This happens when we're not in a BG game, and I have't found where in the GameState the 
                // current mode/format is stored
                return -1;
            }

        }
    }
}