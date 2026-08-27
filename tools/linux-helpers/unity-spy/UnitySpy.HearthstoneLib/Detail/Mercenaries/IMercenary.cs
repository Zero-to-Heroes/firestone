namespace HackF5.UnitySpy.HearthstoneLib
{
    using HackF5.UnitySpy.HearthstoneLib.Detail.Mercenaries;
    using JetBrains.Annotations;
    using System.Collections.Generic;

    [PublicAPI]
    public interface IMercenary
    {
        int Id { get; }

        int Level { get; }

        IReadOnlyList<IMercenaryAbility> Abilities { get; }

        IReadOnlyList<IMercenaryEquipment> Equipments { get; }

        IReadOnlyList<IMercenarySkin> Skins { get; }

        IList<MercenaryTreasure> Treasures { get; }

        int Attack { get; }

        int Health { get; }

        long CurrencyAmount { get; }

        long Experience { get; }

        bool IsFullyUpgraded { get; }

        bool Owned { get; }

        int Premium { get; set; }

        int Rarity { get; set; }

        int Role { get; set; }

        MercenaryLoadout Loadout { get; set; }
    }

    [PublicAPI]
    public interface IMercenaryAbility
    {
        string CardId { get; }

        int Tier { get; }
    }

    [PublicAPI]
    public interface IMercenaryEquipment
    {
        int Id { get; }

        int CardType { get; }

        bool Owned { get; }

        bool Equipped { get; }

        int Tier { get; }
    }

    [PublicAPI]
    public interface IMercenarySkin
    {

        int Id { get; }

        int CardDbfId { get; }

        bool Default { get; }

        //bool Equipped { get; }

        int Premium { get; }
    }
}