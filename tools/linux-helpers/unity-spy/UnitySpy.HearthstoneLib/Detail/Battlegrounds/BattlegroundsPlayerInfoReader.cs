// ReSharper disable StringLiteralTypo
namespace HackF5.UnitySpy.HearthstoneLib.Detail.Battlegrounds
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    internal static class BattlegroundsPlayerInfoReader
    {
        // If the teammate fights first, it works, otherwise we have dupes
        // Maybe use cardId + atk + health + divine shield + taunt attributes to define equality, and remove dupes from player board
        public static BgsTeamInfo ReadPlayerBoard(HearthstoneImage image)
        {
            var teammateBoard = BattlegroundsDuoInfoReader.ReadPlayerTeammateBoard(image);
            var service = image["GameState"]?["s_instance"];
            List<BgsEntity> entities = ReadAllEntities(service);

            var teammateBoardEntityIds = new HashSet<int>(
                teammateBoard?.Board?.Select(m => m.EntityId()) ?? Array.Empty<int>());
            var teammateHandEntityIds = new HashSet<int>(
                teammateBoard?.Hand?.Select(m => m.EntityId()) ?? Array.Empty<int>());
            var teammateSecretEntityIds = new HashSet<int>(
                teammateBoard?.Secrets?.Select(m => m.EntityId()) ?? Array.Empty<int>());

            // Partition by zone in a single pass instead of re-filtering the full entity list for every
            // collection below.
            var playEntities = new List<BgsEntity>();
            var handZoneEntities = new List<BgsEntity>();
            var secretZoneEntities = new List<BgsEntity>();
            foreach (var e in entities)
            {
                switch (e.GetZone())
                {
                    case Zone.PLAY:
                        playEntities.Add(e);
                        break;
                    case Zone.HAND:
                        handZoneEntities.Add(e);
                        break;
                    case Zone.SECRET:
                        secretZoneEntities.Add(e);
                        break;
                }
            }

            var hero = playEntities
                .Where(e => e.GetCardType() == CardType.HERO)
                .Where(e => e.EntityId() != teammateBoard?.Hero?.EntityId())
                .FirstOrDefault();
            if (hero == null)
            {
                return null;
            }
            var heroController = hero.GetController(); 
            var heroPower = playEntities
                .Where(e => e.GetCardType() == CardType.HERO_POWER)
                .Where(e => e.EntityId() != teammateBoard?.HeroPower?.EntityId())
                .FirstOrDefault();
            // Group enchantment candidates once instead of scanning all entities for every board minion.
            var enchantmentLookup = BattlegroundsDuoInfoReader.BuildEnchantmentLookup(entities);
            var board = playEntities
                .Where(e => e.GetController() == heroController)
                .Where(e => e.IsOnBoard())
                .Where(e => !teammateBoardEntityIds.Contains(e.EntityId()))
                .Select(e => BattlegroundsDuoInfoReader.AddEnchantments(e, enchantmentLookup))
                .OrderBy(e => e.GetZonePosition())
                .ToList();
            var boardDebug = playEntities
                .Where(e => e.GetController() == heroController)
                .Where(e => e.IsOnBoard())
                // Not sure what this maps to, but it looks like the teammate entities don't have this set
                .Where(e => e.GetTag((GameTag)3669, -1) == 0)
                .Where(e => !teammateBoardEntityIds.Contains(e.EntityId()))
                .Select(e => BattlegroundsDuoInfoReader.AddEnchantments(e, enchantmentLookup))
                .OrderBy(e => e.GetZonePosition())
                .ToList();
            var hand = handZoneEntities
                .Where(e => e.GetController() == heroController)
                .Where(e => !teammateHandEntityIds.Contains(e.EntityId()))
                .OrderBy(e => e.GetZonePosition())
                .ToList();
            var secrets = secretZoneEntities
                .Where(e => e.GetController() == heroController)
                .Where(e => !teammateSecretEntityIds.Contains(e.EntityId()))
                .OrderBy(e => e.GetZonePosition())
                .ToList();
            return new BgsTeamInfo()
            {
                Player = new BgsPlayerInfo()
                {
                    Hero = hero,
                    HeroPower = heroPower,
                    Board = board,
                    BoardDebug = boardDebug,
                    Hand = hand,
                    Secrets = secrets,
                },
                Teammate = teammateBoard,
            };
        }

        private static List<BgsEntity> ReadAllEntities(dynamic service)
        {
            var result = new List<BgsEntity>();
            var playerMap = service?["m_playerMap"];
            if (playerMap == null)
            {
                return result;
            }

            var count = playerMap["count"];
            // Hoisted out of the loop: each indexer access re-reads the whole array from process memory.
            var playerSlots = count > 0 ? playerMap["valueSlots"] : null;
            var playerId = -1;
            var heroEntityId = -1;
            var controllerId = -1;
            for (var i = 0; i < count; i++)
            {
                var memPlayer = playerSlots[i];
                if (memPlayer == null || memPlayer["m_local"] == false)
                {
                    continue;
                }

                List<EntityTag> tags = BattlegroundsDuoInfoReader.ReadTags(memPlayer["m_tags"]["m_values"]);
                playerId = tags.Find(t => t.Name == (int)GameTag.PLAYER_ID)?.Value ?? 0;
                heroEntityId = tags.Find(t => t.Name == (int)GameTag.HERO_ENTITY)?.Value ?? 0;
                controllerId = tags.Find(t => t.Name == (int)GameTag.CONTROLLER)?.Value ?? 0;
            }

            var entityMap = service["m_entityMap"];
            var entitiesCount = entityMap["count"];
            var values = entityMap["valueSlots"];
            foreach (var entityNode in values)
            {
                if (entityNode == null)
                {
                    continue;
                }

                var cardId = entityNode["m_cardIdInternal"];
                if (string.IsNullOrEmpty(cardId))
                {
                    continue;
                }

                var memTags = entityNode["m_tags"]?["m_values"];
                var tags = BattlegroundsDuoInfoReader.ReadTags(memTags);
                var entity = new BgsEntity()
                {
                    CardId = cardId,
                    Tags = tags,
                };
                if (entity.GetController() != controllerId) 
                {
                    continue;
                }

                result.Add(entity);
            }
            return result;

        }
    }
}