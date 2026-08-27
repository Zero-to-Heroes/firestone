namespace HackF5.UnitySpy.HearthstoneLib.Detail.OpenPacksInfo
{
    using System;
    using System.CodeDom;
    using System.Collections.Generic;
    using System.Linq;
    using HackF5.UnitySpy.HearthstoneLib;
    using JetBrains.Annotations;

    internal static class OpenPacksInfoReader
    {
        // m_draggedPack

        public static IOpenPacksInfo ReadOpenPacksInfo([NotNull] HearthstoneImage image)
        {
            if (image["PackOpening"] == null)
            {
                return null;
            }

            // For some reason I still get NPEs here
            try
            {
                var temp = image["PackOpening"]["s_instance"];
            }
            catch (Exception e)
            {
                return null;
            }

            var packOpeningMgr = image["PackOpening"]["s_instance"];
            if (packOpeningMgr == null)
            {
                return null;
            }

            var unopenedPacks = new List<IBoosterStack>();
            // Resolve the map and its backing array once: each indexer access is a live memory read.
            var unopenedPacksMap = packOpeningMgr["m_unopenedPacks"];
            if (unopenedPacksMap != null)
            {
                int numberOfStacks = unopenedPacksMap["count"] ?? 0;
                var unopenedValueSlots = numberOfStacks > 0 ? unopenedPacksMap["valueSlots"] : null;
                for (int i = 0; i < numberOfStacks; i++)
                {
                    var memUnopenedStack = unopenedValueSlots[i];
                    unopenedPacks.Add(new BoosterStack
                    {
                        BoosterId = memUnopenedStack["m_boosterDbId"],
                        Count = memUnopenedStack["m_count"],
                        //EverGrantedCount = memUnopenedStack["m_boosterStack"]["<EverGrantedCount>k__BackingField"],
                    });
                }
            }

            IPackOpening packOpening = null;
            if (packOpeningMgr["m_director"] != null)
            {
                var cards = new List<IPackCard>();
                var director = packOpeningMgr["m_director"];
                var catchupPackPile = director["m_catchupPackPileWidget"];
                var numberOfPacks = director["m_numPacksOpened"] ?? 1;
                if (catchupPackPile != null)
                {
                    var modelMap = catchupPackPile["m_template"]?["m_dataContext"]?["m_modelMap"];
                    if (modelMap != null && modelMap["_count"] > 0)
                    {
                        var cardsListModel = modelMap["_entries"][0]?["value"]?["m_Cards"]?["m_list"];
                        if (cardsListModel != null)
                        {
                            var numberOfCards = cardsListModel["_size"];
                            // Hoisted out of the loop: each indexer access re-reads the whole array.
                            var cardListItems = numberOfCards > 0 ? cardsListModel["_items"] : null;
                            for (int i = 0; i < numberOfCards; i++)
                            {
                                var card = cardListItems[i];
                                cards.Add(new PackCard()
                                {
                                    CardId = card["m_CardId"],
                                    Premium = card["m_Premium"],
                                    IsNew = true,
                                    Revealed = true,
                                });
                            }
                            packOpening = new PackOpening
                            {
                                Cards = cards,
                                NumberOfPacks = numberOfPacks,
                            };
                        }
                    }
                }

                if (packOpening == null)
                {
                    var cardsPendingReveal = director["m_cardsPendingReveal"] ?? 0;
                    if (cardsPendingReveal > 0)
                    {
                        var hiddenCards = director["m_hiddenCards"]["m_cards"];
                        if (hiddenCards != null)
                        {
                            var numberOfCards = hiddenCards["_size"];
                            // Hoisted out of the loop: each indexer access re-reads the whole array.
                            var hiddenCardItems = numberOfCards > 0 ? hiddenCards["_items"] : null;
                            for (int i = 0; i < numberOfCards; i++)
                            {
                                var memCard = hiddenCardItems[i];
                                if (memCard == null)
                                {
                                    return null;
                                }
                                var mercenaryPack = memCard["m_mercenaryPackComponent"];
                                if (mercenaryPack == null)
                                {
                                    cards.Add(new PackCard()
                                    {
                                        CardId = memCard["m_boosterCard"]?["<Def>k__BackingField"]?["<Name>k__BackingField"],
                                        Premium = memCard["m_premium"],
                                        IsNew = memCard["m_isNew"],
                                        Revealed = memCard["m_revealed"],
                                    });
                                }
                                else
                                {
                                    cards.Add(new PackCard()
                                    {
                                        Premium = memCard["m_premium"],
                                        IsNew = memCard["m_isNew"],
                                        Revealed = memCard["m_revealed"],
                                        CurrencyAmount = mercenaryPack["_CurrencyAmount"],
                                        MercenaryArtVariationId = mercenaryPack["_MercenaryArtVariationId"],
                                        MercenaryArtVariationPremium = mercenaryPack["_MercenaryArtVariationPremium"],
                                        MercenaryId = mercenaryPack["_MercenaryId"],
                                    });
                                }
                            }
                        }
                    }
                    packOpening = new PackOpening
                    {
                        CardsPendingReveal = cardsPendingReveal,
                        Cards = cards,
                        NumberOfPacks = numberOfPacks,
                    };
                }
            }

            return new OpenPacksInfo
            {
                LastOpenedBoosterId = packOpeningMgr["m_lastOpenedBoosterId"],
                UnopenedPacks = unopenedPacks,
                PackOpening = packOpening,
            };
        }

        public static List<PackInfo> ReadOpenPackInfo([NotNull] HearthstoneImage image)
        {
            var openPacksInfo = OpenPacksInfoReader.ReadOpenPacksInfo(image);
            if (openPacksInfo?.PackOpening?.Cards == null
                || openPacksInfo.PackOpening.Cards.Any(card => card == null || (card.CardId == null && card.MercenaryId == -1)))
            {
                return null;
            }

            var cards = openPacksInfo.PackOpening.Cards;
            var numberOfPacks = openPacksInfo.PackOpening.NumberOfPacks;
            var cardsPerPack = (int)Math.Ceiling((double)(cards.Count / numberOfPacks));
            var result = new List<PackInfo>();
            for (var i = 0; i < numberOfPacks; i++)
            {
                var cardsForPack = cards.ToList().GetRange(cardsPerPack * i, cardsPerPack);
                result.Add(new PackInfo
                {
                    BoosterId = openPacksInfo.LastOpenedBoosterId,
                    Cards = cardsForPack
                        .Select(card => new CardInfo
                        {
                            CardId = card.CardId,
                            Premium = card.Premium,
                            IsNew = card.IsNew,
                            CurrencyAmount = card.CurrencyAmount,
                            MercenaryArtVariationId = card.MercenaryArtVariationId,
                            MercenaryArtVariationPremium = card.MercenaryArtVariationPremium,
                            MercenaryId = card.MercenaryId,
                        } as ICardInfo)
                        .ToList(),
                });
            }
            return result;
        }

        public static List<PackInfo> ReadMassOpenPackInfo([NotNull] HearthstoneImage image)
        {
            var packOpeningMgr = image["PackOpening"]?["s_instance"];
            var massSummary = packOpeningMgr?["m_director"]?["m_massPackOpeningSummary"];
            if (massSummary == null)
            {
                return null;
            }

            var result = new List<PackInfo>();
            int numberOfPacks = massSummary["m_numPacksOpened"];
            var cardsStructure = massSummary["m_cards"];
            if (cardsStructure == null)
            {
                return null;
            }

            var cardItems = cardsStructure["_items"];
            int totalCards = cardsStructure["_size"];
            var boosterId = packOpeningMgr["m_packOpeningId"];
            var lastOpenedBoosterId = packOpeningMgr["m_lastOpenedBoosterId"];
            for (var currentPackIndex = 0; currentPackIndex < numberOfPacks; currentPackIndex++)
            {
                // To accomodate variable size packs
                int numberOfCardsPerPack = (int)Math.Ceiling((double)(totalCards / numberOfPacks));
                var cards = new List<ICardInfo>();
                for (var currentCardInPackIndex = currentPackIndex * numberOfCardsPerPack; currentCardInPackIndex < currentPackIndex * numberOfCardsPerPack + numberOfCardsPerPack; currentCardInPackIndex++)
                {
                    try
                    {
                        var cardItem = cardItems[currentCardInPackIndex]["<Def>k__BackingField"];
                        cards.Add(new CardInfo()
                        {
                            CardId = cardItem["<Name>k__BackingField"],
                            Premium = cardItem["<Premium>k__BackingField"],
                        });
                    }
                    catch
                    {
                        // Do nothing, probably because of the numberOfCardsPerPack that wasn't well defined
                    }
                }
                result.Add(new PackInfo()
                {
                    BoosterId = boosterId,
                    Cards = cards,
                });
            }

            return result;
        }

        public static bool ReadIsOpeningPack([NotNull] HearthstoneImage image)
        {
            int? cardsPendingReveal = image?["PackOpening"]?["s_instance"]?["m_director"]?["m_cardsPendingReveal"];
            return cardsPendingReveal != null && cardsPendingReveal > 0;
        }
    }
}
