namespace HackF5.UnitySpy.Detail
{
    using System;
    using System.Collections.Generic;
    using JetBrains.Annotations;

    /// <summary>
    /// This class represents a value type /struct instance in managed memory.
    /// Mono and .NET don't necessarily use the same layout scheme, but assuming it is similar this article provides
    /// some useful information:
    /// https://web.archive.org/web/20080919091745/http://msdn.microsoft.com:80/en-us/magazine/cc163791.aspx.
    /// </summary>
    [PublicAPI]
    public class ManagedStructInstance : ManagedObjectInstance
    {
        public ManagedStructInstance([NotNull] TypeDefinition typeDefinition, List<TypeInfo> genericTypeArguments, IntPtr address)
            : base((typeDefinition ?? throw new ArgumentNullException(nameof(typeDefinition))).Image, genericTypeArguments, address)
        {
            // value type pointers contain no type information as a significant performance optimization. in memory
            // a value type is simply a contiguous sequence of bytes and it is up to the runtime to know how to
            // interpret those bytes. if you take the example of a integer, then it makes sense why this is
            // as if an integer needed an extra pointer that pointed back to the System.Int32 class then the size
            // of each one would be doubled. presumably interoperability with native assemblies would also be
            // completely scuppered.
            this.TypeDefinition = typeDefinition;
        }

        public override TypeDefinition TypeDefinition { get; }
    }
}