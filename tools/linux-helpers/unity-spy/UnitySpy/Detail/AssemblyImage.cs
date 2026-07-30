namespace HackF5.UnitySpy.Detail
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Linq;
    using HackF5.UnitySpy.Util;
    using JetBrains.Annotations;

    /// <summary>
    /// Represents an unmanaged _MonoImage instance in a Mono process. This object describes a managed assembly.
    /// The .NET equivalent is <see cref="System.Reflection.Assembly"/>.
    /// See: _MonoImage in https://github.com/Unity-Technologies/mono/blob/unity-master/mono/metadata/metadata-internals.h.
    /// </summary>
    [PublicAPI]
    public class AssemblyImage : MemoryObject, IAssemblyImage
    {
        private readonly Dictionary<string, TypeDefinition> typeDefinitionsByFullName =
            new Dictionary<string, TypeDefinition>();

        private readonly ConcurrentDictionary<IntPtr, TypeDefinition> typeDefinitionsByAddress;
        private bool disposed;

        public AssemblyImage(ProcessFacade process, IntPtr address)
            : base(null, address)
        {
            this.Process = process;

            this.typeDefinitionsByAddress = this.CreateTypeDefinitions();

            foreach (var definition in this.TypeDefinitions)
            {
                definition.Init();
            }

            foreach (var definition in this.TypeDefinitions)
            {
                if (definition.FullName.Contains("`"))
                {
                    // ignore generic classes as they have name clashes. in order to make them unique these it would be
                    // necessary to examine the information held in TypeInfo.Data. see
                    // ProcessFacade.ReadManagedGenericObject for moral support.
                    continue;
                }

                if (!this.typeDefinitionsByFullName.ContainsKey(definition.FullName))
                {
                    this.typeDefinitionsByFullName.Add(definition.FullName, definition);
                }
            }
        }

        IEnumerable<ITypeDefinition> IAssemblyImage.TypeDefinitions => this.TypeDefinitions;

        public IEnumerable<TypeDefinition> TypeDefinitions =>
            this.typeDefinitionsByAddress.Values;

        public override AssemblyImage Image => this;

        public override ProcessFacade Process { get; }

        public dynamic this[string fullTypeName] => this.GetTypeDefinition(fullTypeName);

        ITypeDefinition IAssemblyImage.GetTypeDefinition(string fullTypeName) => this.GetTypeDefinition(fullTypeName);

        public TypeDefinition GetTypeDefinition(string fullTypeName) =>
            this.typeDefinitionsByFullName.TryGetValue(fullTypeName, out var d) ? d : default;

        public TypeDefinition GetTypeDefinition(IntPtr address)
        {
            if (address == Constants.NullPtr)
            {
                return default;
            }

            return this.typeDefinitionsByAddress.GetOrAdd(
                address,
                key => new TypeDefinition(this, key));
        }

        public void Dispose()
        {
            if (!disposed)
            {
                Process?.Dispose();
                disposed = true;
            }
        }

        private ConcurrentDictionary<IntPtr, TypeDefinition> CreateTypeDefinitions()
        {
            var definitions = new ConcurrentDictionary<IntPtr, TypeDefinition>();

            int classCache = this.Process.MonoLibraryOffsets.ImageClassCache; 
            var classCacheSize = this.ReadUInt32(classCache + this.Process.MonoLibraryOffsets.HashTableSize);
            var classCacheTableArray = this.ReadPtr(classCache + this.Process.MonoLibraryOffsets.HashTableTable);

            for (var tableItem = 0;
                tableItem < (classCacheSize * this.Process.SizeOfPtr);
                tableItem += this.Process.SizeOfPtr)
            {
                for (var definition = this.Process.ReadPtr(classCacheTableArray + tableItem);
                    definition != Constants.NullPtr;
                    definition = this.Process.ReadPtr(definition + this.Process.MonoLibraryOffsets.TypeDefinitionNextClassCache))
                {
                    definitions.GetOrAdd(definition, new TypeDefinition(this, definition));
                }
            }

            return definitions;
        }
    }
}