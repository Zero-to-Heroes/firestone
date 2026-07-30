namespace HackF5.UnitySpy
{
    using JetBrains.Annotations;

    /// <summary>
    /// Represents an unmanaged _MonoClassField instance in a Mono process. This object describes a field in a
    /// managed class or struct. The .NET equivalent is <see cref="System.Reflection.FieldInfo"/>.
    /// See: _MonoImage in https://github.com/Unity-Technologies/mono/blob/unity-master/mono/metadata/class-internals.h.
    /// </summary>
    [PublicAPI]
    public interface IFieldDefinition : IMemoryObject
    {
        /// <summary>
        /// Gets the name of the field.
        /// </summary>
        string Name { get; }

        /// <summary>
        /// Gets the <see cref="ITypeDefinition"/> of the type in which the field is declared.
        /// </summary>
        ITypeDefinition DeclaringType { get; }

        /// <summary>
        /// Gets an object that describes type information about field.
        /// </summary>
        ITypeInfo TypeInfo { get; }
    }
}