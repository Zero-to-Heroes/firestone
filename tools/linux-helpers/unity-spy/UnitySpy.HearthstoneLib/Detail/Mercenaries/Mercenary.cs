using System.Collections.Generic;

namespace HackF5.UnitySpy.HearthstoneLib.Detail.Mercenaries
{
    internal class Mercenary : IMercenary
    {
        public int Id { get; set; }

        public int Level { get; set; }

        public IReadOnlyList<IMercenaryAbility> Abilities { get; set; }

        public IReadOnlyList<IMercenaryEquipment> Equipments { get; set; }

        public IReadOnlyList<IMercenarySkin> Skins { get; set; }

        public IList<MercenaryTreasure> Treasures { get; set; }

        public int Attack { get; set; }

        public int Health { get; set; }

        public long CurrencyAmount { get; set; }

        public long Experience { get; set; }

        public bool IsFullyUpgraded { get; set; }

        public bool Owned { get; set; }

        public int Premium { get; set; }

        public int Rarity { get; set; }

        public int Role { get; set; }

        public MercenaryLoadout Loadout { get; set; }
    }

    public class MercenaryTreasure
    {
        public int TreasureId { get; set; }

        public uint Scalar { get; set; }
    }

    public class MercenaryLoadout
    {
        public int ArtVariationPremium { get; set; }
        public MercenaryLoadoutArtVariation ArtVariation { get; set; }
        public MercenaryLoadoutEquipment Equipment { get; set; }
    }

    public class MercenaryLoadoutArtVariation
    {
        public int Id { get; set; }
        public int CardDbfId { get; set; }
        public bool Default { get; set; }
        public int MercenaryId { get; set; }
    }

    public class MercenaryLoadoutEquipment
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }

    internal class MercenaryAbility : IMercenaryAbility
    {
        public string CardId { get; set; }

        public int Tier { get; set; }

        public int MythicModifier { get; set; }
    }

    internal class MercenaryEquipment : IMercenaryEquipment
    {
        public int Id { get; set; }

        public int CardType { get; set; }

        public bool Owned { get; set; }

        public bool Equipped { get; set; }

        public int Tier { get; set; }

        public int MythicModifier { get; set; }
    }


    internal class MercenarySkin : IMercenarySkin
    {

        public int Id { get; set; }

        public int CardDbfId { get; set; }

        public bool Default { get; set; }

        //public bool Equipped { get; set; }

        public int Premium { get; set; }
    }
}