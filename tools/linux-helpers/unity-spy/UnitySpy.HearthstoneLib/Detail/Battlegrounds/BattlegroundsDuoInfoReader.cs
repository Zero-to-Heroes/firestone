// ReSharper disable StringLiteralTypo
namespace HackF5.UnitySpy.HearthstoneLib.Detail.Battlegrounds
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    internal static class BattlegroundsDuoInfoReader
    {
        public static BgsPlayerInfo ReadPlayerTeammateBoard(HearthstoneImage image)
        {
            var service = image["TeammateBoardViewer"]?["s_instance"];
            if (service == null)
            {
                return null;
            }

            List<BgsEntity> minionEntities = ReadEntities(service["m_teammateMinionViewer"]);
            List<BgsEntity> handEntities = ReadEntities(service["m_teammateHandViewer"]);
            List<BgsEntity> secretEntities = ReadEntities(service["m_teammateSecretViewer"]);
            List<BgsEntity> heroEntities = ReadEntities(service["m_teammateHeroViewer"]);

            var hero = ReadHero(service);
            if (hero == null)
            {
                return null;
            }

            var heroController = hero.GetController();
            var heroPower = ReadHeroPower(service);
            var minionEnchantments = BuildEnchantmentLookup(minionEntities);
            var board = minionEntities
                .Where(e => e.GetController() == heroController)
                .Where(e => e.IsOnBoard())
                .Select(e => AddEnchantments(e, minionEnchantments))
                .OrderBy(e => e.GetZonePosition())
                .ToList();
            var hand = handEntities
                .Where(e => e.GetController() == heroController)
                .Where(e => e.GetZone() == Zone.HAND)
                .OrderBy(e => e.GetZonePosition())
                .ToList();
            var secrets = secretEntities
                .Where(e => e.GetController() == heroController)
                .OrderBy(e => e.GetZonePosition())
                .ToList();
            var trinkets = heroEntities
                .Where(e => e.GetController() == heroController)
                .Where(e => e.IsTrinket() && e.GetSpellSchool() != SpellSchool.NONE)
                .OrderBy(e => e.GetZonePosition())
                .ToList();
            return new BgsPlayerInfo()
            {
                Hero = hero,
                HeroPower = heroPower,
                Board = board,
                Hand = hand,
                Secrets = secrets,
                Trinkets = trinkets,
            };
        }

        private static BgsEntity ReadHeroPower(dynamic service)
        {
            var entityActors = service["m_teammateHeroViewer"]?["m_entityActors"];
            if (entityActors == null)
            {
                return null;
            }

            var count = entityActors["_count"];
            var entries = entityActors["_entries"];
            for (var i = 0; i < count; i++)
            {
                var entity = entries[i]?["value"]?["m_entity"];
                if (entity == null)
                {
                    continue;
                }
                var cardId = entity["m_cardIdInternal"];
                var memTags = entity["m_tags"]["m_values"];
                var tags = ReadTags(memTags);
                var result = new BgsEntity()
                {
                    CardId = cardId,
                    Tags = tags,
                };
                if (result.GetCardType() == CardType.HERO_POWER)
                {
                    return result;
                }
            }
            return null;
        }

        private static BgsEntity ReadHero(dynamic service)
        {
            var memHero = service["m_teammateHeroViewer"]?["m_teammateHero"];
            if (memHero == null)
            {
                return null;
            }

            var cardId = memHero["m_cardIdInternal"];
            var memTags = memHero["m_tags"]["m_values"];
            var tags = ReadTags(memTags);
            return new BgsEntity()
            {
                CardId = cardId,
                Tags = tags,
            };
        }

        private static List<BgsEntity> ReadEntities(dynamic service)
        {
            var actorsDict = service?["m_entityActors"];
            var count = actorsDict?["_count"] ?? 0;
            // Hoisted out of the loop: each indexer access re-reads the whole array from process memory.
            var actorEntries = count > 0 ? actorsDict["_entries"] : null;
            var result = new List<BgsEntity>();
            for (var i = 0; i < count; i++)
            {
                var entity = actorEntries[i]?["value"]?["m_entity"];
                if (entity == null)
                {
                    continue;
                }
                // For Putricide creations, this sometimes return null
                var cardId = entity?["m_cardIdInternal"] ?? entity?["m_staticEntityDef"]?["m_cardIdInternal"];
                var memTags = entity["m_tags"]["m_values"];
                var tags = ReadTags(memTags);
                result.Add(new BgsEntity()
                {
                    CardId = cardId,
                    Tags = tags,
                });
            }
            return result;
        }

        public static List<EntityTag> ReadTags(dynamic memTags)
        {
            var result = new List<EntityTag>();
            if (memTags == null)
            {
                return result;
            }

            var count = memTags["_count"];
            var entries = (object[])memTags["_entries"];
            for (var i = 0; i < count; i++)
            {
                // Strongly typed access: skips the DLR dispatch of the dynamic indexer per tag.
                if (!(entries[i] is IManagedObjectInstance memTag))
                {
                    continue;
                }

                result.Add(new EntityTag()
                {
                    Name = memTag.GetValue<int>("key"),
                    Value = memTag.GetValue<int>("value"),
                });
            }
            return result;
        }

        /// <summary>
        /// Groups candidate enchantments by (zone, attached-to entity id) once, so attaching enchantments to a
        /// board is a dictionary lookup per minion instead of a scan over all entities per minion (O(N^2)).
        /// </summary>
        public static ILookup<(Zone Zone, int AttachedTo), BgsEntity> BuildEnchantmentLookup(List<BgsEntity> entities)
        {
            return entities.ToLookup(e => (e.GetZone(), e.GetTag(GameTag.ATTACHED)));
        }

        public static BgsEntity AddEnchantments(BgsEntity entity, ILookup<(Zone Zone, int AttachedTo), BgsEntity> enchantmentLookup)
        {
            entity.Enchantments = enchantmentLookup[(entity.GetZone(), entity.GetTag(GameTag.ENTITY_ID))].ToList();
            return entity;
        }
    }
}