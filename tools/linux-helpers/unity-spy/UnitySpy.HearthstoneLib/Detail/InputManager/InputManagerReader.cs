namespace HackF5.UnitySpy.HearthstoneLib.Detail.InputManager
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using HackF5.UnitySpy.HearthstoneLib;
    using HackF5.UnitySpy.HearthstoneLib.Detail.OpenPacksInfo;
    using JetBrains.Annotations;

    internal static class InputManagerReader
    {
        public static MousedOverCard ReadCurrentMousedOverCard([NotNull] HearthstoneImage image)
        {
            var inputManager = image["InputManager"]?["s_instance"];
            if (inputManager == null)
            {
                return null;
            }

            var mousedOverCard = inputManager["m_mousedOverCard"];
            if (mousedOverCard == null)
            {
                return null;
            }

            var zone = mousedOverCard["m_zone"];
            var zoneSide = zone?["m_Side"];
            var zoneTag = zone?["m_ServerTag"];
            var entity = mousedOverCard["m_entity"];
            var cardId = entity["m_cardIdInternal"];
            var tagsMap = entity["m_tags"]["m_values"];
            var count = tagsMap["_count"];
            var entries = tagsMap["_entries"];
            int? entityId = null;
            int? playerId = null;
            var tags = new Dictionary<int, int>();
            for (var i = 0; i < count; i++)
            {
                var entry = entries[i];
                var tag = entry["key"];
                if (tag == (int)GameTag.ENTITY_ID)
                {
                    entityId = entry["value"];
                }
                else if (tag == (int)GameTag.PLAYER_ID)
                {
                    playerId = entry["value"];
                }
                tags.Add(tag, entry["value"]);
            }

            // It messes things up in BG
            // Update 2026-04-16: it doesn't seem too bad
            //tags.TryGetValue((int)GameTag.CARDTYPE, out int cardType);
            //if (cardType == (int)CardType.HERO)
            //{

            //    return null;
            //}

            return new MousedOverCard
            {
                CardId = cardId,
                Zone = zoneTag,
                Side = zoneSide,
                EntityId = entityId,
                PlayerId = playerId,
            };
        }

        public static MousedOverCard ReadCurrentMousedOverBgLeaderboardTile([NotNull] HearthstoneImage image)
        {
            var mouseOverTile = image["PlayerLeaderboardManager"]?["s_instance"]?["m_currentlyMousedOverTile"];
            if (mouseOverTile == null)
            {
                return null;
            }

            // PlayerLeaderboardCard keeps the hero in m_playerHeroEntity (Entity property); fall back to the base
            // HistoryItem.m_entity just in case.
            var entity = mouseOverTile["m_playerHeroEntity"] ?? mouseOverTile["m_entity"];
            if (entity == null)
            {
                return null;
            }

            var cardId = entity["m_cardIdInternal"];
            var tagsMap = entity["m_tags"]["m_values"];
            var count = tagsMap["_count"];
            var entries = tagsMap["_entries"];
            int? entityId = null;
            int? playerId = null;
            for (var i = 0; i < count; i++)
            {
                var entry = entries[i];
                var tag = entry["key"];
                if (tag == (int)GameTag.ENTITY_ID)
                {
                    entityId = entry["value"];
                }
                else if (tag == (int)GameTag.PLAYER_ID)
                {
                    playerId = entry["value"];
                }
            }

            return new MousedOverCard
            {
                CardId = cardId,
                EntityId = entityId,
                PlayerId = playerId,
            };
        }

        public static MousedOverCard ReadMousedOverDraftOption([NotNull] HearthstoneImage image)
        {
            return ReadMousedOverDraftOptions(image);
                //?? ReadMousedOverRedraftOption(image);
        }

        // Doesn't work, I can't detect the currently moused over card
        //public static MousedOverCard ReadMousedOverRedraftOption([NotNull] HearthstoneImage image)
        //{
        //    //var hoveredSlot = image["DraftDisplay"]?["s_instance"]?["m_hoveredCardSlot"];
        //    var hoveredSlot = image["DraftDisplay"]?["s_instance"]?["m_redraftCardSlots"]?["_items"]?[0]?["m_hoverSlotSound"];
        //    if (hoveredSlot == null)
        //    {
        //        Console.WriteLine($"No hoveredSlot");
        //        return null;
        //    }

        //    hoveredSlot = image["DraftDisplay"]?["s_instance"]?["m_redraftCardSlots"]?["_items"]?[0];
        //    var index = hoveredSlot["m_index"];
        //    Console.WriteLine($"index {index}");
        //    var draftManager = image["DraftDisplay"]?["s_instance"]?["m_draftManager"];
        //    if (draftManager == null)
        //    {
        //        Console.WriteLine($"No draftManager");
        //        return null;
        //    }

        //    var redraftSlots = draftManager["m_undergroundRedraftDeck"]?["m_slots"];
        //    if (redraftSlots == null)
        //    {
        //        Console.WriteLine($"No draftManager");
        //        return null;
        //    }

        //    var redraft = redraftSlots["_items"][index];
        //    return new MousedOverCard
        //    {
        //        CardId = redraft["m_cardId"],
        //        Side = 0,
        //    };
        //}

        public static MousedOverCard ReadMousedOverDraftOptions([NotNull] HearthstoneImage image)
        {
            var choices = image["DraftDisplay"]?["s_instance"]?["m_choices"];
            if (choices == null)
            {
                return null;
            }

            var items = choices["_items"];
            if (items == null)
            {
                return null;
            }

            foreach (var item in items)
            {
                if (item == null)
                {
                    continue;
                }
                var actor = item["m_actor"];
                if (actor == null)
                {
                    continue;
                }

                var actorState = actor["m_actorState"];
                if (actorState == 2)
                {
                    return new MousedOverCard
                    {
                        CardId = item["m_cardID"],
                        Side = 0,
                    };
                }
            }

            return null;
        }
    }
}
