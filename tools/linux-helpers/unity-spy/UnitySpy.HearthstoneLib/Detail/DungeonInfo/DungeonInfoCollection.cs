// ReSharper disable IdentifierTypo

namespace HackF5.UnitySpy.HearthstoneLib.Detail.DungeonInfo
{
    using System;
    using System.Collections;
    using System.Collections.Generic;
    using JetBrains.Annotations;

    internal class DungeonInfoCollection : IDungeonInfoCollection
    {
        private readonly IReadOnlyDictionary<DungeonKey, IDungeonInfo> internalDictionary;

        public DungeonInfoCollection([NotNull] Dictionary<DungeonKey, IDungeonInfo> internalDictionary)
        {
            this.internalDictionary = internalDictionary ?? throw new ArgumentNullException(nameof(internalDictionary));
        }

        public int Count => this.internalDictionary.Count;

        public IEnumerable<DungeonKey> Keys => this.internalDictionary.Keys;

        public IEnumerable<IDungeonInfo> Values => this.internalDictionary.Values;

        public IDungeonInfo this[DungeonKey key] => this.internalDictionary[key];

        public bool ContainsKey(DungeonKey key) => this.internalDictionary.ContainsKey(key);

        public IEnumerator<KeyValuePair<DungeonKey, IDungeonInfo>> GetEnumerator() =>
            this.internalDictionary.GetEnumerator();

        IEnumerator IEnumerable.GetEnumerator() => ((IEnumerable)this.internalDictionary).GetEnumerator();

        public bool TryGetValue(DungeonKey key, out IDungeonInfo value) =>
            this.internalDictionary.TryGetValue(key, out value);
    }
}