// ReSharper disable StringLiteralTypo
namespace HackF5.UnitySpy.HearthstoneLib.Detail.Match
{
    using System;

    internal static class MatchInfoReader
    {
        public static IMatchInfo ReadMatchInfo(HearthstoneImage image)
        {
            var matchInfo = new MatchInfo();
            var gameState = image["GameState"]?["s_instance"];

            // Resolve the player map once: each indexer access is a live memory read.
            var playerMap = gameState?["m_playerMap"];
            if (playerMap != null)
            {
                var playerIds = playerMap["keySlots"];
                var players = (object[])playerMap["valueSlots"];
                var playerCount = playerMap["count"];
                for (var i = 0; i < playerCount; i++)
                {
                    // Strongly typed access: resolve the element once and skip the DLR dispatch.
                    if (!(players[i] is IManagedObjectInstance playerInstance)
                        || playerInstance.TypeDefinition?.Name != "Player")
                    {
                        continue;
                    }

                    var side = (Side)playerInstance.GetValue<int>("m_side");
                    var playerId = playerIds[i] ?? -1;
                    var player = ReadPlayerInfo(image, playerInstance, playerId);
                    if (player == null)
                    {
                        continue;
                    }

                    switch (side)
                    {
                        case Side.FRIENDLY:
                                matchInfo.LocalPlayer = player;
                                break;

                        case Side.OPPOSING:
                            matchInfo.OpposingPlayer = player;
                            break;

                        case Side.NEUTRAL:
                            break;

                        default:
                            throw new InvalidOperationException($"Unknown side {side}.");
                    }
                }
            }

            if ((matchInfo.LocalPlayer == null) && (matchInfo.OpposingPlayer == null))
            {
                return null;
            }

            var gameMgr = image.GetService("GameMgr");
            if (gameMgr != null)
            {
                matchInfo.MissionId = gameMgr["m_missionId"] ?? -1;
                matchInfo.GameType = (GameType)(gameMgr["m_gameType"] ?? 0);
                matchInfo.FormatType = (GameFormat)(gameMgr["m_formatType"] ?? 0);
            }

            var boardDbId = MatchInfoReader.RetrieveBoardInfo(image);
            matchInfo.BoardDbId = boardDbId;

            return matchInfo;
        }

        private static Player ReadPlayerInfo(HearthstoneImage image, IManagedObjectInstance player, int playerId)
        {
            // Walk the m_medalInfo chain once (each segment is a live memory read) and use strongly typed
            // field reads to skip the DLR dispatch of the dynamic indexer.
            var medalInfo = player.GetValue<IManagedObjectInstance>("m_medalInfo")
                ?.GetValue<dynamic>("m_currMedalInfo");
            if (medalInfo == null)
            {
                return null;
            }
            var standardMedalInfo = GetMedalInfo(medalInfo, GameFormat.FT_STANDARD);
            var wildMedalInfo = GetMedalInfo(medalInfo, GameFormat.FT_WILD);
            var classicMedalInfo = GetMedalInfo(medalInfo, GameFormat.FT_CLASSIC);
            var twistMedalInfo = GetMedalInfo(medalInfo, GameFormat.FT_TWIST);

            var standard = MatchInfoReader.BuildRank(image, standardMedalInfo);
            var wild = MatchInfoReader.BuildRank(image, wildMedalInfo);
            var classic = MatchInfoReader.BuildRank(image, classicMedalInfo);
            var twist = MatchInfoReader.BuildRank(image, twistMedalInfo);
            var playerName = player.GetValue<string>("m_name");
            var cardBack = player.GetValue<int>("m_cardBackId");
            var accountId = player.GetValue<IManagedObjectInstance>("m_gameAccountId")
                ?.GetValue<IManagedObjectInstance>("<EntityId>k__BackingField");
            var account = accountId != null
                ? new Account { Hi = accountId.GetValue<ulong>("high_"), Lo = accountId.GetValue<ulong>("low_") }
                : new Account { Hi = 0, Lo = 0 };
            //var battleTag = MatchInfoReader.GetBattleTag(image, account);
            return new Player
            {
                Id = playerId,
                Name = playerName,
                Standard = standard,
                Wild = wild,
                Classic = classic,
                Twist = twist,
                CardBackId = cardBack,
                Account = account,
                //BattleTag = battleTag,
            };
        }

        private static object GetMedalInfo(dynamic medalInfo, GameFormat format)
        {
            if (medalInfo == null)
            {
                return null;
            }

            //var keys = medalInfo["keySlots"];
            var values = (object[])medalInfo["valueSlots"];
            var count = medalInfo["count"];
            for (int i = 0; i < count; i++)
            {
                // Strongly typed access: skips the DLR dispatch of the dynamic indexer in this loop.
                if (values[i] is IManagedObjectInstance medal && medal.GetValue<int>("format") == (int)format)
                {
                    return medal;
                }
            }

            return null;
        }

        public static int RetrieveBoardInfo(HearthstoneImage image)
        {
            var boardService = image["Board"];
            try
            {
                return boardService?["s_instance"]?["m_boardDbId"] ?? -1;
            }
            catch (Exception e)
            {
                Logger.Log($"Could not get Board Info: {e.ToString()}");
                return -1;
            }
        }

        private static BattleTag GetBattleTag(HearthstoneImage image, IAccount account)
        {
            var gameAccounts = image["BnetPresenceMgr"]?["s_instance"]?["m_gameAccounts"];
            if (gameAccounts == null)
            {
                return null;
            }

            var keys = gameAccounts["keySlots"];
            var keyCount = gameAccounts["count"];
            // Hoisted out of the loop: each indexer access re-reads the whole array from process memory.
            var accountValues = gameAccounts["valueSlots"];
            for (var i = 0; i < keyCount; i++)
            {
                // Resolve the key once per iteration.
                var accountKey = keys[i];
                if ((accountKey?["m_hi"] != account.Hi) || (accountKey?["m_lo"] != account.Lo))
                {
                    continue;
                }

                try
                {
                    var bTag = accountValues?[i]?["m_battleTag"];
                    return new BattleTag
                    {
                        Name = bTag?["m_name"],
                        Number = bTag?["m_number"] ?? -1,
                    };
                } 
                catch (Exception e)
                {
                    return null;
                }
            }

            return null;
        }

        private static Rank BuildRank(HearthstoneImage image, dynamic medalInfo)
        {
            if (medalInfo == null)
            {
                return null;
            }

            var internalLeagueId = medalInfo["leagueId"] ?? -1;
            var starLevel = medalInfo["starLevel"] ?? -1;
            var legendRank = medalInfo["legendIndex"] ?? 0;
            var leagueRankInfo = MatchInfoReader.GetLeagueRank(image, internalLeagueId, starLevel);
            return new Rank
            {
                LeagueId = leagueRankInfo?.LeagueId ?? -1,
                RankValue = leagueRankInfo?.Rank ?? -1,
                LegendRank = legendRank,
                SeasonId = medalInfo["seasonId"] ?? -1,
                StarLevel = starLevel,
            };
        }


        private static dynamic GetLeagueRank(HearthstoneImage image, int internalLeagueId, int starLevel)
        {
            var leagueRankRecord = MatchInfoReader.GetLeagueRankRecord(image, internalLeagueId, starLevel);
            if (leagueRankRecord == null)
            {
                return null;
            }

            string cheatName = leagueRankRecord["m_cheatName"];
            if (cheatName == null || cheatName.Length == 0)
            {
                return null;
            }

            string leagueName = MatchInfoReader.ExtractLeagueName(cheatName);
            if (leagueName == null || leagueName.Length == 0)
            {
                return null;
            }

            var splitRank = cheatName.Split(leagueName.ToCharArray(), StringSplitOptions.RemoveEmptyEntries)[0];
            int.TryParse(splitRank, out int rank);
            return new
            {
                LeagueId = LeagueNameToId(leagueName),
                Rank = rank,
            };
        }

        private static string ExtractLeagueName(string cheatName)
        {
            if (cheatName == null)
            {
                return null;
            }

            if (cheatName.Contains("bronze"))
            {
                return "bronze";
            }
            else if (cheatName.Contains("silver"))
            {
                return "silver";
            }
            else if (cheatName.Contains("gold"))
            {
                return "gold";
            }
            else if (cheatName.Contains("plat"))
            {
                return "platinum";
            }
            else if (cheatName.Contains("diamond"))
            {
                return "diamond";
            }
            return null;
        }

        private static int LeagueNameToId(string leagueName)
        {
            switch (leagueName)
            {
                case "bronze": return 5;
                case "silver": return 4;
                case "gold": return 3;
                case "platinum": return 2;
                case "diamond": return 1;
            }
            return -1;
        }

        private static dynamic GetLeagueRankRecord(HearthstoneImage image, int leagueId, int starLevel)
        {
            var rankManager = image["RankMgr"]?["s_instance"];
            if (rankManager == null)
            {
                return null;
            }

            var rankConfig = rankManager["m_rankConfigByLeagueAndStarLevel"];
            if (rankConfig == null)
            {
                return null;
            }

            var leagueKeys = rankConfig["keySlots"];
            var leagueValues = rankConfig["valueSlots"];
            for (var i = 0; i < leagueKeys.Length; i++)
            {
                if (leagueKeys[i] != leagueId)
                {
                    continue;
                }

                var starLevelMap = leagueValues[i];
                if (starLevelMap == null)
                {
                    return null;
                }

                var starLevelKeys = starLevelMap["keySlots"];
                var starLevelValues = starLevelMap["valueSlots"];
                for (var j = 0; j < starLevelKeys.Length; j++)
                {
                    if (starLevelKeys[j] != starLevel)
                    {
                        continue;
                    }

                    return starLevelValues[j];
                }
            }

            return null;
        }

    }
}