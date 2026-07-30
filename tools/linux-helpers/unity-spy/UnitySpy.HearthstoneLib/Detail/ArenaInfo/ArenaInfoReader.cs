namespace HackF5.UnitySpy.HearthstoneLib.Detail.ArenaInfo
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Runtime.InteropServices;
    using System.Text;
    using HackF5.UnitySpy.HearthstoneLib;
    using HackF5.UnitySpy.HearthstoneLib.Detail.AccountInfo;
    using HackF5.UnitySpy.HearthstoneLib.Detail.Deck;
    using HackF5.UnitySpy.HearthstoneLib.Detail.GameDbf;
    using HackF5.UnitySpy.HearthstoneLib.Detail.RewardsInfo;
    using HackF5.UnitySpy.HearthstoneLib.Detail.SceneMode;
    using JetBrains.Annotations;

    internal static class ArenaInfoReader
    {
        public static IArenaInfo ReadArenaInfo([NotNull] HearthstoneImage image)
        {
            if (image == null)
            {
                throw new ArgumentNullException(nameof(image));
            }

            var draftManager = image.GetService("DraftManager");
            if (draftManager == null)
            {
                return null;
            }

            var gameType = draftManager["m_undergroundActive"] == true ? GameType.GT_UNDERGROUND_ARENA : GameType.GT_ARENA;
            var draftDeck = gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_undergroundDraftDeck"] : draftManager["m_draftDeck"];
            var heroCardId = draftDeck?["<HeroCardID>k__BackingField"];
            var wins = (gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_undergroundWins"] : draftManager["m_wins"]) ?? -1;
            var losses = (gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_undergroundLosses"] : draftManager["m_losses"]) ?? -1;
            return new ArenaInfo
            {
                GameType = gameType,
                Wins = wins,
                Losses = losses,
                HeroCardId = heroCardId,
                Deck = ReadArenaDeck(image),
                Rewards = RewardsInfoReader.ParseRewards(draftManager["m_chest"]?["<Rewards>k__BackingField"]?["_items"]),
            };
        }

        public static int? ReadArenaCurrentDraftSlot([NotNull] HearthstoneImage image)
        {
            return ReadCurrentDraftSlot(image, GameType.GT_ARENA);
        }
        public static int? ReadArenaUndergroundCurrentDraftSlot([NotNull] HearthstoneImage image, bool debug = false)
        {
            return ReadCurrentDraftSlot(image, GameType.GT_UNDERGROUND_ARENA, debug);
        }
        private static int? ReadCurrentDraftSlot([NotNull] HearthstoneImage image, GameType gameType, bool debug = false)
        {
            //if (image == null)
            //{
            //    throw new ArgumentNullException(nameof(image));
            //}

            //var draftDisplay = image["DraftDisplay"]?["s_instance"];
            //if (draftDisplay == null)
            //{
            //    return null;
            //}

            //// m_chosenIndex = 1;
            //// m_currentClientState = Ready
            //// How to make sure that we don't send the value for the last pick multiple times?
            //// Or maybe send it multiple times, and just ignore it in the UI?
            //var currentMode = draftDisplay["m_currentMode"];
            //if (currentMode != (int)DraftMode.DRAFTING && currentMode != (int)DraftMode.REDRAFTING && currentMode != (int)DraftMode.ACTIVE_DRAFT_DECK)
            //{
            //    return null;
            //}

            //var draftManager = image.GetService("DraftManager");
            //if (draftManager == null)
            //{
            //    return null;
            //}

            //var currentSlot = gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_currentUndergroundSlot"] : draftManager["m_currentSlot"];
            //var currentRedraftSlot = gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_currentUndergroundRedraftSlot"] : draftManager["m_currentRedraftSlot"];
            //return currentSlot + Math.Max(0, currentRedraftSlot);
            var draftManager = image.GetService("DraftManager");
            if (draftManager == null)
            {
                return null;
            }

            var draftDisplay = image["DraftDisplay"]?["s_instance"];
            if (draftDisplay == null)
            {
                return null;
            }

            var currentSlot = gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_currentUndergroundSlot"] : draftManager["m_currentSlot"];
            if (debug)
            {
                Logger.Log($"[arena-draft-manager] currentSlot: {currentSlot}");
            }
            var currentRedraftSlot = gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_currentUndergroundRedraftSlot"] : draftManager["m_currentRedraftSlot"];
            if (debug)
            {
                Logger.Log($"[arena-draft-manager] currentRedraftSlot: {currentRedraftSlot}");
            }
            var losses = gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_undergroundLosses"] : 0;
            if (debug)
            {
                Logger.Log($"[arena-draft-manager] losses: {losses}");
            }
            var pickNumber = currentSlot + Math.Max(0, losses - 1) * 5 + Math.Max(0, currentRedraftSlot);
            if (debug)
            {
                Logger.Log($"[arena-draft-manager] pickNumber: {pickNumber}");
            }
            return pickNumber;
        }

        public static ArenaCardPick ReadArenaLatestCardPick([NotNull] HearthstoneImage image)
        {
            return ReadLatestCardPick(image, GameType.GT_ARENA);
        }

        public static ArenaCardPick ReadArenaUndergroundLatestCardPick([NotNull] HearthstoneImage image)
        {
            return ReadLatestCardPick(image, GameType.GT_UNDERGROUND_ARENA);
        }

        private static ArenaCardPick ReadLatestCardPick([NotNull] HearthstoneImage image, GameType gameType)
        {
            var start = DateTime.UtcNow.Ticks;
            var draftManager = image.GetService("DraftManager");
            if (draftManager == null)
            {
                //Logger.Log($"[arena-draft-manager] ReadLatestCardPick no draftManager");
                return null;
            }

            var draftDisplay = image["DraftDisplay"]?["s_instance"];
            if (draftDisplay == null)
            {
                //Logger.Log($"[arena-draft-manager] ReadLatestCardPick no draftDisplay");
                return null;
            }

            // Do it first so that it's built before they can change?
            var choices = ReadCardOptions(image);
            //Logger.Log($"[arena-draft-manager] ReadLatestCardPick options {string.Join(", ", choices?.Select(o => o.CardId))}");
            if (choices == null)
            {
                return null;
            }

            // It's 1-based
            var pickIndex = draftManager["m_chosenIndex"];
            //Logger.Log($"[arena-draft-manager] ReadLatestCardPick pickIndex {pickIndex}");
            if (pickIndex == 0)
            {
                return null;
            }

            var draftDeck = gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_undergroundDraftDeck"] : draftManager["m_draftDeck"];
            var heroCardId = draftDeck["<HeroCardID>k__BackingField"];

            var currentSlot = gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_currentUndergroundSlot"] : draftManager["m_currentSlot"];
            Logger.Log($"[arena-draft-manager] ReadLatestCardPick currentSlot {currentSlot}");
            var currentRedraftSlot = gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_currentUndergroundRedraftSlot"] : draftManager["m_currentRedraftSlot"];
            Logger.Log($"[arena-draft-manager] ReadLatestCardPick currentRedraftSlot {currentRedraftSlot}");
            var losses = gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_undergroundLosses"] : 0;
            Logger.Log($"[arena-draft-manager] ReadLatestCardPick losses {losses}");
            // -1 because when we call this, the current slot has already changed to the next
            // i.e. we are picking card number 21, slot changes to 22, then triggers the last pick detection
            var pickNumber = (currentSlot - 1) + Math.Max(0, losses - 1) * 5 + Math.Max(0, currentRedraftSlot);
            Logger.Log($"[arena-draft-manager] ReadLatestCardPick pickNumber {pickNumber}");

            var cardId = choices[pickIndex - 1]?.CardId;

            var accountInfo = AccountInfoReader.ReadAccountInfo(image);
            var deckId = $"{accountInfo.Hi}-{accountInfo.Lo}-{draftDeck["ID"]}";

            Logger.Log($"[arena-draft-manager] ReadLatestCardPick Processed pick in {(DateTime.UtcNow.Ticks - start) / TimeSpan.TicksPerMillisecond}");
            var cardPick = new ArenaCardPick()
            {
                GameType = gameType,
                RunId = deckId,
                PickNumber = pickNumber,
                CardId = cardId,
                Options = choices,
                HeroCardId = heroCardId,
            };
            return cardPick;
        }

        public static GameType? ReadArenaDraftGameType([NotNull] HearthstoneImage image)
        {
            if (image == null)
            {
                throw new ArgumentNullException(nameof(image));
            }

            var draftManager = image.GetService("DraftManager");
            if (draftManager == null)
            {
                return null;
            }

            var gameType = draftManager["m_undergroundActive"] == true ? GameType.GT_UNDERGROUND_ARENA : GameType.GT_ARENA;
            return gameType;
        }

        public static IDeck ReadArenaDeck([NotNull] HearthstoneImage image)
        {
            var draftManager = image.GetService("DraftManager");
            if (draftManager == null)
            {
                return null;
            }

            var gameType = draftManager["m_undergroundActive"] == true ? GameType.GT_UNDERGROUND_ARENA : GameType.GT_ARENA;
            var draftDeck = gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_undergroundDraftDeck"] : draftManager["m_draftDeck"];
            if (draftDeck == null)
            {
                return null;
            }

            var slots = draftDeck["m_slots"];
            List<string> decklist = new List<string>();
            AddCardsFromSlots(slots, decklist);

            if (gameType == GameType.GT_UNDERGROUND_ARENA)
            {
                var isRedrafting =
                    draftManager["m_currentClientState"] == (int)ArenaClientStateType.Underground_Draft
                    || draftManager["m_currentClientState"] == (int)ArenaClientStateType.Underground_Redraft
                    || draftManager["m_undergroundSessionState"] == (int)ArenaSessionState.DRAFTING
                    || draftManager["m_undergroundSessionState"] == (int)ArenaSessionState.REDRAFTING;

                if (isRedrafting)
                {
                    var redraftDeck = draftManager["m_undergroundRedraftDeck"];
                    var redraftSlots = redraftDeck?["m_slots"];
                    AddCardsFromSlots(redraftSlots, decklist);
                }
            }


            var accountInfo = AccountInfoReader.ReadAccountInfo(image);
            var deckId = $"{accountInfo.Hi}-{accountInfo.Lo}-{draftDeck["ID"]}";
            var losses = gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_undergroundLosses"] : draftManager["m_losses"];
            var wins = -1;
            var heroPowerCardId = draftDeck["HeroPowerCardID"];
            if (heroPowerCardId == null || heroPowerCardId.Length == 0)
            {
                heroPowerCardId = image["DraftDisplay"]?["s_instance"]?["m_heroPower"]?["m_entityDef"]?["m_cardIdInternal"];
            }
            return new Deck()
            {
                Id = deckId,
                DeckList = decklist,
                FormatType = draftDeck["<FormatType>k__BackingField"],
                GameType = gameType,
                HeroCardId = draftDeck["<HeroCardID>k__BackingField"],
                HeroPowerCardId = heroPowerCardId,
                Name = null,
                Losses = losses,
                Wins = wins,
            };
        }

        private static void AddCardsFromSlots(dynamic slots, List<string> decklist)
        {
            if (slots == null)
            {
                return;
            }

            var size = slots["_size"];
            var items = slots["_items"];
            for (var i = 0; i < size; i++)
            {
                var item = items[i];
                var cardId = item["m_cardId"];
                // Count is stored separately for normal + golden + diamond
                var cardCount = 0;
                var count = item["m_count"];
                var countSize = count["_size"];
                var countItems = count["_items"];
                for (var j = 0; j < countSize; j++)
                {
                    cardCount += countItems[j];
                }
                for (var j = 0; j < cardCount; j++)
                {
                    decklist.Add(cardId);
                }
            }
        }

        public static bool IsShowingScreenOverDraft([NotNull] HearthstoneImage image)
        {
            try
            {
                var draftDisplay = image["DraftDisplay"]?["s_instance"];
                if (draftDisplay == null)
                {
                    return false;
                }

                var legendaryBucketDetailsPopup = draftDisplay["m_packageCardsPopup"]?["m_chooseButtonVisualController"]?["m_enabledInternally"] ?? false;
                if (legendaryBucketDetailsPopup)
                {
                    return true;
                }

                var draftManager = image.GetService("DraftManager");
                if (draftManager == null)
                {
                    return false;
                }

                int clientState = draftManager["m_currentClientState"];
                if (clientState == (int)ArenaClientStateType.Normal_Landing || clientState == (int)ArenaClientStateType.Underground_Landing)
                {
                    return true;
                }

                return false;
            }
            catch (Exception e)
            {
                Logger.Log($"Exception when trying to IsShowingScreenOverDraft: {e.ToString()}");
                return false;
            }
        }

        public static DraftSlotType? ReadDraftStep([NotNull] HearthstoneImage image)
        {
            var draftDisplay = image["DraftDisplay"]?["s_instance"];
            if (draftDisplay == null)
            {
                return DraftSlotType.DRAFT_SLOT_NONE;
            }

            var currentMode = draftDisplay["m_currentMode"];
            if (currentMode == (int)DraftMode.REDRAFTING)
            {
                return DraftSlotType.DRAFT_SLOT_CARD;
            }

            if (draftDisplay["m_currentMode"] != (int)DraftMode.DRAFTING)
            {
                return DraftSlotType.DRAFT_SLOT_NONE;
            }

            var draftManager = image.GetService("DraftManager");
            if (draftManager == null)
            {
                return DraftSlotType.DRAFT_SLOT_NONE;
            }


            var gameType = draftManager["m_undergroundActive"] == true ? GameType.GT_UNDERGROUND_ARENA : GameType.GT_ARENA;
            var currentSlot = gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_currentUndergroundSlotType"] : draftManager["m_currentSlotType"];
            return (DraftSlotType)currentSlot;
        }

        public static DraftMode? ReadDraftMode([NotNull] HearthstoneImage image)
        {
            var draftDisplay = image["DraftDisplay"]?["s_instance"];
            if (draftDisplay == null)
            {
                return null;
            }

            var currentMode = draftDisplay["m_currentMode"];
            return (DraftMode)currentMode;
        }

        public static ArenaClientStateType? ReadClientState([NotNull] HearthstoneImage image)
        {
            try
            {
                var draftDisplay = image["DraftDisplay"]?["s_instance"];
                if (draftDisplay == null)
                {
                    return null;
                }

                var draftManager = image.GetService("DraftManager");
                if (draftManager == null)
                {
                    return null;
                }

                int clientState = draftManager["m_currentClientState"];
                return (ArenaClientStateType)clientState;
            }
            catch (Exception e)
            {
                Logger.Log($"Exception when trying to ReadClientState: {e.ToString()}");
                return null;
            }
        }

        public static ArenaSessionState? ReadSessionState([NotNull] HearthstoneImage image)
        {
            try
            {
                var draftManager = image.GetService("DraftManager");
                if (draftManager == null)
                {
                    return null;
                }

                var gameType = draftManager["m_undergroundActive"] == true ? GameType.GT_UNDERGROUND_ARENA : GameType.GT_ARENA;
                int sessionState = gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_undergroundSessionState"] : draftManager["m_normalSessionState"];
                return (ArenaSessionState)sessionState;
            }
            catch (Exception e)
            {
                Logger.Log($"Exception when trying to ReadClientState: {e.ToString()}");
                return null;
            }
        }

        public static List<string> ReadHeroOptions([NotNull] HearthstoneImage image)
        {
            var draftDisplay = image["DraftDisplay"]?["s_instance"];
            if (draftDisplay == null)
            {
                return null;
            }

            if (draftDisplay["m_currentMode"] != 2)
            {
                return null;
            }

            var draftManager = image.GetService("DraftManager");
            if (draftManager == null)
            {
                return null;
            }

            var gameType = draftManager["m_undergroundActive"] == true ? GameType.GT_UNDERGROUND_ARENA : GameType.GT_ARENA;
            var currentSlot = gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_currentUndergroundSlotType"] : draftManager["m_currentSlotType"];
            if (currentSlot != (int)DraftSlotType.DRAFT_SLOT_HERO)
            {
                return null;
            }

            var choices = draftDisplay["m_choices"];
            var numberOfOptions = choices["_size"];
            // Hoisted out of the loop: each indexer access re-reads the whole array from process memory.
            var choiceItems = numberOfOptions > 0 ? choices["_items"] : null;
            var result = new List<string>();
            for (int i = 0; i < numberOfOptions; i++)
            {
                var option = choiceItems[i];
                result.Add(option["m_cardID"]);
            }
            return result;
        }

        public static List<string> ReadHeroPowerOptions([NotNull] HearthstoneImage image)
        {
            var draftDisplay = image["DraftDisplay"]?["s_instance"];
            if (draftDisplay == null)
            {
                return null;
            }

            if (draftDisplay["m_currentMode"] != 2)
            {
                return null;
            }

            var draftManager = image.GetService("DraftManager");
            if (draftManager == null)
            {
                return null;
            }

            var gameType = draftManager["m_undergroundActive"] == true ? GameType.GT_UNDERGROUND_ARENA : GameType.GT_ARENA;
            var currentSlot = gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_currentUndergroundSlotType"] : draftManager["m_currentSlotType"];
            if (currentSlot != (int)DraftSlotType.DRAFT_SLOT_HERO_POWER)
            {
                return null;
            }

            var choices = draftDisplay["m_choices"];
            var numberOfOptions = choices["_size"];
            // Hoisted out of the loop: each indexer access re-reads the whole array from process memory.
            var choiceItems = numberOfOptions > 0 ? choices["_items"] : null;
            var result = new List<string>();
            for (int i = 0; i < numberOfOptions; i++)
            {
                var option = choiceItems[i];
                result.Add(option["m_cardID"]);
            }
            return result;
        }

        public static List<ArenaCardOption> ReadCardOptions([NotNull] HearthstoneImage image)
        {
            var draftDisplay = image["DraftDisplay"]?["s_instance"];
            if (draftDisplay == null)
            {
                return null;
            }

            var choices = draftDisplay["m_choices"];
            if (choices == null)
            {
                return null;
            }

            var numberOfOptions = choices["_size"];
            // Hoisted out of the loops: each indexer access re-reads the whole array from process memory.
            var choiceItems = numberOfOptions > 0 ? choices["_items"] : null;
            var result = new List<ArenaCardOption>();
            for (int i = 0; i < numberOfOptions; i++)
            {
                var option = choiceItems[i];
                var packageCardIds = new List<string>();
                var memCardIds = option["m_packageCardIds"];
                var count = memCardIds?["_size"] ?? 0;
                var memCardIdItems = count > 0 ? memCardIds["_items"] : null;
                for (int j = 0; j < count; j++)
                {
                    packageCardIds.Add(memCardIdItems[j]);
                }
                result.Add(new ArenaCardOption()
                {
                    CardId = option["m_cardID"],
                    PackageCardIds = packageCardIds,
                });
            }
            return result;
        }

        public static List<string> ReadPackageCardOptions([NotNull] HearthstoneImage image)
        {
            var draftDisplay = image["DraftDisplay"]?["s_instance"];
            if (draftDisplay == null)
            {
                return null;
            }

            if (draftDisplay["m_currentMode"] != 2)
            {
                return null;
            }

            var draftManager = image.GetService("DraftManager");
            if (draftManager == null)
            {
                return null;
            }

            // Issue: the slotType changes before the cards change
            var gameType = draftManager["m_undergroundActive"] == true ? GameType.GT_UNDERGROUND_ARENA : GameType.GT_ARENA;
            var currentSlot = gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_currentUndergroundSlotType"] : draftManager["m_currentSlotType"];
            if (currentSlot != (int)DraftSlotType.DRAFT_SLOT_CARD)
            {
                return null;
            }

            // Check that the hero and hero power have been chosen
            if (draftDisplay["m_chosenHero"] == null || draftDisplay["m_heroPower"] == null)
            {
                return null;
            }

            var isOpen = draftDisplay["m_packageCardsPopup"]?["m_chooseButtonVisualController"]?["m_enabledInternally"] ?? false;
            if (!isOpen)
            {
                return new List<string>();
            }

            var popup = draftDisplay["m_packageCardsPopup"]?["m_relatedCardsTray"];
            var memCards = popup["m_relatedCardList"]?["m_list"];
            var numberOfOptions = memCards["_size"];
            // Hoisted out of the loop: each indexer access re-reads the whole array from process memory.
            var memCardItems = numberOfOptions > 0 ? memCards["_items"] : null;
            var result = new List<string>();
            for (int i = 0; i < numberOfOptions; i++)
            {
                var option = memCardItems[i];
                result.Add(option["m_CardId"]);
            }
            return result;
        }

        public static Tuple<int, string> ReadNumberOfCardsInDeck(HearthstoneImage image)
        {
            try
            {
                var draftManager = image.GetService("DraftManager");
                if (draftManager == null)
                {
                    return null;
                }

                // Check that the current deck is not complete
                var gameType = draftManager["m_undergroundActive"] == true ? GameType.GT_UNDERGROUND_ARENA : GameType.GT_ARENA;
                var draftDeck = gameType == GameType.GT_UNDERGROUND_ARENA ? draftManager["m_undergroundDraftDeck"] : draftManager["m_draftDeck"];

                int numberOfCardsInDeck = 0;
                StringBuilder cardIds = new StringBuilder();
                var slots = draftDeck?["m_slots"];
                int numberOfDifferentCardsInDeck = slots?["_size"] ?? 0;
                // Hoisted out of the loops: each indexer access re-reads the whole array from process memory.
                var slotItems = numberOfDifferentCardsInDeck > 0 ? slots["_items"] : null;
                for (var i = 0; i < numberOfDifferentCardsInDeck; i++)
                {
                    var slot = slotItems[i];
                    if (slot == null)
                    {
                        continue;
                    }

                    var count = slot["m_count"];
                    var cardId = slot["m_cardId"];
                    var countSize = count["_size"];
                    var countItems = countSize > 0 ? count["_items"] : null;
                    for (var j = 0; j < countSize; j++)
                    {
                        var countItem = countItems[j];
                        if (countItem > 0)
                        {
                            numberOfCardsInDeck += countItem;
                            for (var k = 0; k < countItem; k++)
                            {
                                cardIds.Append("-" + cardId);
                            }
                        }
                    }
                }

                var numberOfCardsInSideboards = 0;
                // Resolve the sideboards dictionary and its entries once: re-walking the chain per
                // iteration re-reads every segment (and the whole entries array) from process memory.
                var sideboardsDict = draftDeck?["m_sideboardManager"]?["m_sideboards"];
                int nbSideboards = sideboardsDict?["_count"] ?? 0;
                var sideboardEntries = nbSideboards > 0 ? sideboardsDict["_entries"] : null;
                for (var i = 0; i < nbSideboards; i++)
                {
                    var sideboard = sideboardEntries[i]["value"];
                    if (sideboard != null)
                    {
                        var nbCardsInSideboard = sideboard["m_slots"]["_size"];
                        numberOfCardsInSideboards += nbCardsInSideboard;
                    }
                }

                int numberOfCardsInRedraftDeck = 0;
                if (gameType == GameType.GT_UNDERGROUND_ARENA)
                {
                    var redraftSlots = draftManager["m_undergroundRedraftDeck"]?["m_slots"];
                    int numberOfDifferentCardsInRedraftDeck = redraftSlots?["_size"] ?? 0;
                    // Hoisted out of the loops: each indexer access re-reads the whole array.
                    var redraftSlotItems = numberOfDifferentCardsInRedraftDeck > 0 ? redraftSlots["_items"] : null;
                    for (var i = 0; i < numberOfDifferentCardsInRedraftDeck; i++)
                    {
                        var slot = redraftSlotItems[i];
                        var count = slot["m_count"];
                        var cardId = slot["m_cardId"];
                        var countSize = count["_size"];
                        var countItems = countSize > 0 ? count["_items"] : null;
                        for (var j = 0; j < countSize; j++)
                        {
                            var countItem = countItems[j];
                            numberOfCardsInRedraftDeck += countItem;
                            for (var k = 0; k < countItem; k++)
                            {
                                cardIds.Append("-" + cardId);
                            }
                        }
                    }
                }

                return new Tuple<int, string>(numberOfCardsInDeck + numberOfCardsInSideboards + numberOfCardsInRedraftDeck, cardIds.ToString());
            }
            catch (Exception e)
            {
                Logger.Log($"Exception while reading cards in deck: {e.ToString()}");
                return null;
            }
        }
    }
}
