// ReSharper disable StringLiteralTypo
namespace HackF5.UnitySpy.HearthstoneLib.Detail.Mercenaries
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    internal static class MercenariesInfoReader
    {
        public static IMercenariesInfo ReadMercenariesInfo(HearthstoneImage image)
        {
            var netCacheMercenaries = image.GetNetCacheService("NetCacheMercenariesPlayerInfo");
            var pvpRating = netCacheMercenaries?["<PvpRating>k__BackingField"];

            var netCacheMercenariesMap = image.GetNetCacheService("NetCacheLettuceMap")?["<Map>k__BackingField"];
            IMercenariesMap map = null;
            if (netCacheMercenariesMap != null)
            {
                var playerData = netCacheMercenariesMap["_PlayerData"];
                var playerDataSize = playerData["_size"];
                var playerDataItem = playerDataSize > 0 ? playerData["_items"][0] : null;

                //var playerTeamList = playerDataItem?["_TeamList"]?["_Mercenaries"]; 
                var teamId = playerDataItem["_TeamId"];
                var mercCollection = ReadMercenariesCollectionInfo(image);
                var fullTeam = mercCollection.Teams.Where(t => t.Id == teamId).FirstOrDefault();

                //var teamList = new List<int>();
                //var teamSize = playerTeamList?["_size"] ?? 0;
                //for (var i = 0; i < teamSize; i++)
                //{
                //    teamList.Add(playerTeamList["_items"][i]);
                //}

                var deadMercsList = netCacheMercenariesMap?["_DeadMercenaries"];
                var deadMercsListSize = deadMercsList["_size"];
                // Hoisted out of the loops: each indexer access re-reads the whole array from process memory.
                var deadMercsItems = deadMercsListSize > 0 ? deadMercsList["_items"] : null;
                var deadMercs = new List<int>();
                for (var i = 0; i < deadMercsListSize; i++)
                {
                    var deadMercsItem = deadMercsItems[i]?["_MercenaryIds"];
                    var size = deadMercsItem["_size"];
                    var mercenaryIdItems = size > 0 ? deadMercsItem["_items"] : null;
                    for (var j = 0; j < size; j++)
                    {
                        deadMercs.Add(mercenaryIdItems[j]);
                    }

                }

                var turnsTaken = netCacheMercenariesMap["_TurnsTaken"];
                var nodes = netCacheMercenariesMap["_Nodes"];
                var nodesSize = nodes["_size"];
                var nodeItems = nodesSize > 0 ? nodes["_items"] : null;
                uint? currentRow = 0;
                uint? maxRow = 0;
                for (var i = 0; i < nodesSize; i++)
                {
                    var node = nodeItems[i];
                    if (node["_NodeState_"] == (int)NodeState.COMPLETE)
                    {
                        // Row N is completed, which means we're at step N + 1
                        currentRow = Math.Max(currentRow ?? 0, node["_Row"] + 1);
                    }
                    maxRow = Math.Max(maxRow ?? 0, node["_Row"]);
                }

                //var fullTeam = BuildFullTeam(image, teamList);
                map = new MercenariesMap()
                {
                    BountyId = netCacheMercenariesMap["_BountyId"],
                    MapId = netCacheMercenariesMap["_MapId"],
                    MapType = netCacheMercenariesMap["_MapType"],
                    Seed = netCacheMercenariesMap["_Seed"],
                    PlayerTeamId = teamId,
                    PlayerTeamName = fullTeam?.Name,
                    PlayerTeamMercIds = fullTeam?.Mercenaries.Select(m => m.Id).ToList(),
                    DeadMercIds = deadMercs,
                    PlayerTeam = fullTeam?.Mercenaries,
                    CurrentStep = currentRow ?? 0,
                    MaxStep = maxRow ?? 0,
                    TurnsTaken = turnsTaken ?? 0,
                };
            }

            return new MercenariesInfo()
            {
                PvpRating = pvpRating ?? 0,
                Map = map,
            };
        }

        public static IMercenariesCollection ReadMercenariesCollectionInfo(HearthstoneImage image)
        {
            var mercList = BuildAllMercenaries(image);

            var teamsNode = image["CollectionManager"]?["s_instance"]?["m_teams"];
            var teamValues = teamsNode?["valueSlots"];
            var teamsCount = teamValues?.Length ?? 0;
            var teams = new List<IMercenariesTeam>();
            for (var i = 0; i < teamsCount; i++)
            {
                var memTeam = teamValues[i];
                if (memTeam != null)
                {
                    var loadouts = new Dictionary<int, int>();
                    var memLoadouts = memTeam["m_loadouts"];
                    if (memLoadouts != null)
                    {
                        var loadoutsCount = memLoadouts["count"];
                        var keys = memLoadouts["keySlots"];
                        var values = memLoadouts["valueSlots"];
                        for (var j = 0; j < loadoutsCount; j++)
                        {
                            var loadoutKey = keys[j];
                            if (loadoutKey == null)
                            {
                                Logger.Log($"loadoutKey is null: {j}/{loadoutsCount}");
                                continue;
                            } 

                            var mercId = loadoutKey["ID"];
                            var equipment = values[j]?["m_equipmentRecord"];
                            if (equipment != null)
                            {
                                var equipmentId = equipment["m_ID"];
                                loadouts.Add(mercId, equipmentId);
                            }
                        }
                    }
                    teams.Add(new MercenariesTeam()
                    {
                        Id = memTeam["ID"],
                        Name = memTeam["m_name"],
                        Mercenaries = BuildMercenariesList(image, memTeam["m_lettuceMercs"], loadouts)
                    });
                }
            }

            var visitors = ReadMercenariesVisitorsInfo(image, true);
            return new MercenariesCollection()
            {
                Mercenaries = mercList,
                Teams = teams,
                Visitors = visitors,
            };
        }


        public static IReadOnlyList<IMercenariesVisitor> ReadMercenariesVisitorsInfo(HearthstoneImage image, bool debug = false)
        {
            var visitors = new List<IMercenariesVisitor>();
            try
            {
                var visitorsInfo = image.GetNetCacheService("NetCacheMercenariesVillageVisitorInfo")?["<VisitorStates>k__BackingField"];
                // It's important to return "null" when we don't have the info, because it tells the app "we couldn't get the data". An empty
                // list could mean that all tasks are completed
                if (visitorsInfo == null)
                {
                    return null;
                }

                var visitorsCount = visitorsInfo["_size"];
                // Hoisted out of the loop: each indexer access re-reads the whole array from process memory.
                var visitorItems = visitorsCount > 0 ? visitorsInfo["_items"] : null;
                for (var i = 0; i < visitorsCount; i++)
                {
                    var visitorInfo = visitorItems[i];
                    // Resolve the task state once instead of re-walking the chain for every field.
                    var activeTaskState = visitorInfo["_ActiveTaskState"];
                    var additionalMercenaryIds = new List<int>();
                    var additionalMercIds = activeTaskState?["_AdditionalMercenaryId"];
                    var numberOfAdditionalMercs = additionalMercIds?["_size"] ?? 0;
                    var additionalMercIdItems = numberOfAdditionalMercs > 0 ? additionalMercIds["_items"] : null;
                    for (var j = 0; j < numberOfAdditionalMercs; j++)
                    {
                        additionalMercenaryIds.Add(additionalMercIdItems[j]);
                    }
                    visitors.Add(new MercenariesVisitor()
                    {
                        VisitorId = visitorInfo["_VisitorId"],
                        TaskId = activeTaskState?["_TaskId"] ?? -1,
                        TaskChainProgress = visitorInfo["_TaskChainProgress"],
                        TaskProgress = activeTaskState?["_Progress"] ?? 0,
                        Status = activeTaskState?["_Status_"] ?? 0,
                        ProceduralMercenaryId = visitorInfo["_ProceduralMercenaryId"],
                        ProceduralBountyId = activeTaskState?["_ProceduralBountyId"] ?? 0,
                        AdditionalMercenaryIds = additionalMercenaryIds,
                    });
                }
                return visitors;
            }
            catch (Exception e)
            {
                Logger.Log("Exception when retrieving visitors " + e.Message + " " + e.StackTrace);
                return null;
            }
        }

        public static IMercenariesPendingTreasureSelection ReadPendingTreasureSelection(HearthstoneImage image, int treasureIndex = 0)
        {
            if (image == null)
            {
                return null;
            }

            var netCacheMercenariesMap = image.GetNetCacheService("NetCacheLettuceMap")?["<Map>k__BackingField"];
            if (netCacheMercenariesMap == null)
            {
                return null;
            }

            var pendingTreasureSelection = netCacheMercenariesMap["_PendingTreasureSelection"];
            if (pendingTreasureSelection == null)
            {
                return null;
            }

            var items = pendingTreasureSelection["_items"];
            var numberOfTreasures = pendingTreasureSelection["_size"];

            // For now, only handle the first treasure, as I don't know when to switch to a new treasure
            if (numberOfTreasures == 0)
            {
                Logger.Log("No treasure offered");
                return null;
            }

            var currentTreasure = items[treasureIndex];
            var options = currentTreasure["_TreasureOptions"];
            if (options == null)
            {
                Logger.Log("No options");
                return null;
            }

            var numberOfOptions = options["_size"];
            if (numberOfOptions == 0)
            {
                Logger.Log("No numberOfOptions");
                return null;
            }

            var optionDbfIds = new List<int>();
            // Hoisted out of the loop: each indexer access re-reads the whole array from process memory.
            var optionItems = options["_items"];
            for (var i = 0; i < numberOfOptions; i++)
            {
                optionDbfIds.Add((int)optionItems[i]["_TreasureId"]);
            }

            return new MercenariesPendingTreasureSelection()
            {
                MercenaryId = currentTreasure["_MercenaryId"],
                Options = optionDbfIds,
            };
        }

        private static IReadOnlyList<IMercenary> BuildAllMercenaries(HearthstoneImage image)
        {
            var allMercenaries = image["CollectionManager"]?["s_instance"]?["m_collectibleMercenaries"];
            if (allMercenaries == null)
            {
                return new List<IMercenary>();
            }

            var mercenaries = BuildMercenariesList(image, allMercenaries);
            return mercenaries;
        }

        private static IReadOnlyList<IMercenary> BuildMercenariesList(
            HearthstoneImage image, 
            dynamic mercenariesRoot, 
            IReadOnlyDictionary<int, int> loadouts = null)
        {
            var mercsCount = mercenariesRoot["_size"];
            // Hoisted out of the loops: each indexer access re-reads the whole array from process memory.
            var mercItems = mercsCount > 0 ? mercenariesRoot["_items"] : null;

            var mercenaries = new List<IMercenary>();
            for (var i = 0; i < mercsCount; i++)
            {
                var mercInfo = mercItems[i];
                int mercId = mercInfo["ID"];

                var mercLevel = mercInfo["m_level"];

                var abilityList = mercInfo["m_abilityList"];
                var abilitiesCount = abilityList["_size"];
                var abilityItems = abilitiesCount > 0 ? abilityList["_items"] : null;
                var mercAbilities = new List<IMercenaryAbility>();
                for (var j = 0; j < abilitiesCount; j++)
                {
                    var ability = abilityItems[j];
                    var unlockLevel = ability["m_unlockLevel"];
                    if (mercLevel < unlockLevel)
                    {
                        continue;
                    }
                    var tierId = ability["m_tier"];
                    var tierList = ability["m_tierList"];
                    var tier = GetTier(tierList, tierId);
                    mercAbilities.Add(new MercenaryAbility()
                    {
                        CardId = tier.CardId,
                        Tier = tier.Tier,
                        MythicModifier = ability["m_mythicModifier"]
                    });
                }

                var equipmentList = mercInfo["m_equipmentList"];
                var equipmentCount = equipmentList["_size"];
                var equipmentItems = equipmentCount > 0 ? equipmentList["_items"] : null;
                var mercEquipments = new List<IMercenaryEquipment>();
                for (var j = 0; j < equipmentCount; j++)
                {
                    var equipment = equipmentItems[j];
                    var equipmentId = equipment["ID"];
                    var equipped = loadouts == null || !loadouts.ContainsKey(mercId) ? false : loadouts[mercId] == equipmentId;
                    mercEquipments.Add(new MercenaryEquipment()
                    {
                        Id = equipmentId,
                        CardType = equipment["m_cardType"],
                        Equipped = equipped,
                        Owned = equipment["m_owned"],
                        Tier = equipment["m_tier"],
                        MythicModifier = equipment["m_mythicModifier"]
                    });
                }

                var artVariations = mercInfo["m_artVariations"];
                var artVariationsCount = artVariations["_size"];
                var artVariationItems = artVariationsCount > 0 ? artVariations["_items"] : null;
                var premium = 0;
                var skins = new List<IMercenarySkin>();
                for (var j = 0; j < artVariationsCount; j++)
                {
                    var variation = artVariationItems[j];
                    premium = Math.Max(premium, variation["m_premium"] ?? 0);
                    // Resolve m_record once instead of once per field read.
                    var variationRecord = variation["m_record"];
                    skins.Add(new MercenarySkin()
                    {
                        Id = variationRecord["m_ID"],
                        CardDbfId = variationRecord["m_cardId"],
                        Default = variation["m_default"],
                        //Equipped = variation["m_equipped"],
                        Premium = variation["m_premium"],
                    });
                }

                MercenaryLoadout loadout = null;
                var memLoadout = mercInfo["m_loadout"];
                if (memLoadout != null)
                {
                    // Resolve the records once instead of re-reading them for every field.
                    var artVariationRecord = memLoadout["m_artVariationRecord"];
                    var artVariation = artVariationRecord == null ? null : new MercenaryLoadoutArtVariation()
                    {
                        Id = artVariationRecord["m_ID"],
                        CardDbfId = artVariationRecord["m_cardId"],
                        Default = artVariationRecord["m_defaultVariation"],
                        MercenaryId = artVariationRecord["m_lettuceMercenaryId"],
                    };
                    var equipmentRecord = memLoadout["m_equipmentRecord"];
                    var equipment = equipmentRecord == null ? null : new MercenaryLoadoutEquipment()
                    {
                        Id = equipmentRecord["m_ID"],
                        Name = equipmentRecord["m_noteDesc"],
                    };
                    loadout = new MercenaryLoadout()
                    {
                        ArtVariationPremium = memLoadout["m_artVariationPremium"],
                        ArtVariation = artVariation,
                        Equipment = equipment,
                    };
                }

                mercenaries.Add(new Mercenary()
                {
                    Id = mercId,
                    Level = mercLevel,
                    Abilities = mercAbilities,
                    Equipments = mercEquipments,
                    Treasures = new List<MercenaryTreasure>(),
                    Attack = mercInfo["m_attack"],
                    Health = mercInfo["m_health"],
                    CurrencyAmount = mercInfo["m_currencyAmount"],
                    Experience = mercInfo["m_experience"],
                    IsFullyUpgraded = mercInfo["m_isFullyUpgraded"],
                    Owned = mercInfo["m_owned"],
                    Premium = premium,
                    Rarity = mercInfo["m_rarity"],
                    Role = mercInfo["m_role"],
                    Skins = skins,
                    Loadout = loadout,
                });
            }

            var treasureAssigments = image.GetNetCacheService("NetCacheLettuceMap")?["<Map>k__BackingField"]?["_TreasureAssignmentList"]?["_TreasureAssignments"];
            if (treasureAssigments != null)
            {
                var treasuresCount = treasureAssigments["_size"];
                // Hoisted out of the loop: each indexer access re-reads the whole array from process memory.
                var treasureItems = treasuresCount > 0 ? treasureAssigments["_items"] : null;
                for (var i = 0; i < treasuresCount; i++)
                {
                    var treasureNode = treasureItems[i];
                    var treasureCard = treasureNode["_Treasure"];
                    var mercId = treasureNode["_AssignedMercenary"];
                    var cardDbfId = treasureCard["_TreasureId"];
                    var teamMerc = mercenaries.Find(merc => merc.Id == mercId);
                    teamMerc?.Treasures.Add(new MercenaryTreasure()
                    {
                        TreasureId = treasureCard["_TreasureId"],
                        Scalar = treasureCard["_Scalar"],
                    });
                }
            }


            return mercenaries;
        }

        private static dynamic GetTier(dynamic tierList, int tierId)
        {
            foreach (var tier in tierList)
            {
                if (tier["m_tier"] == tierId)
                {
                    return new
                    {
                        CardId = tier["m_cardId"],
                        Tier = tier["m_tier"],
                    };
                }
            }
            return null;
        }

        private static int ReadNewRating(dynamic gameState)
        {
            try
            {
                return gameState?["m_gameEntity"]?["<RatingChangeData>k__BackingField"]?["_NewRating"] ?? -1;
            }
            catch (Exception e)
            {
                // Do nothing, but don't pollute the logs
                return -1;
            }
        }
    }
}