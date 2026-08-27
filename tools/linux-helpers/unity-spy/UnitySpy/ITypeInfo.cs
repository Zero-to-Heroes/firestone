namespace HackF5.UnitySpy
{
    using HackF5.UnitySpy.Detail;
    using JetBrains.Annotations;

    /// <summary>
    /// Represents an unmanaged _MonoType instance in a Mono process. This object describes type information.
    /// There is no direct .NET equivalent, but probably comes under the umbrella of <see cref="System.Type"/>.
    /// See: _MonoType in https://github.com/Unity-Technologies/mono/blob/unity-master/mono/metadata/metadata-internals.h.
    /// </summary>
    [PublicAPI]
    public interface ITypeInfo
    {
        /// <summary>
        /// Gets a value indicating whether the entity the info refers to is static; i.e. a static field or a static
        /// class.
        /// </summary>
        bool IsStatic { get; }

        /// <summary>
        /// Gets a value indicating whether the field the info refers to is a constant.
        /// </summary>
        bool IsConstant { get; }

        /// <summary>
        /// Gets a value that describes the type of the entity.
        /// </summary>
        TypeCode TypeCode { get; }

        /// <summary>
        /// Tries to get the <see cref="ITypeDefinition"/> that this type info refers to. If the return value is
        /// <c>false</c> then refer to information in the <see cref="TypeCode"/>.
        /// </summary>
        /// <param name="typeDefinition">
        /// The <see cref="ITypeDefinition"/> that this type info refers to.
        /// </param>
        /// <returns>
        /// A value indicating success.
        /// </returns>
        bool TryGetTypeDefinition(out ITypeDefinition typeDefinition);
    }
}