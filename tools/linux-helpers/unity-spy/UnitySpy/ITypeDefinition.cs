namespace HackF5.UnitySpy
{
    using System.Collections.Generic;
    using JetBrains.Annotations;

    /// <summary>
    /// Represents an unmanaged _MonoClass instance in a Mono process. This object describes the type of a class or
    /// struct. The .NET equivalent is <see cref="System.Type"/>.
    /// See: _MonoImage in https://github.com/Unity-Technologies/mono/blob/unity-master/mono/metadata/class-internals.h.
    /// </summary>
    [PublicAPI]
    public interface ITypeDefinition : IMemoryObject
    {
        /// <summary>
        /// Gets the collection of the <see cref="IFieldDefinition"/> in the type and all of its base types.
        /// </summary>
        IReadOnlyList<IFieldDefinition> Fields { get; }

        /// <summary>
        /// Gets the full name of the type, for example 'System.Object'.
        /// </summary>
        string FullName { get; }

        /// <summary>
        /// Gets a value indicating whether the type derives from <see cref="System.Enum"/>.
        /// </summary>
        bool IsEnum { get; }

        /// <summary>
        /// Gets a value indicating whether the type derives from <see cref="System.ValueType"/>.
        /// </summary>
        bool IsValueType { get; }

        /// <summary>
        /// Gets the name of the type. For example for 'System.Object' this value would be 'Object'.
        /// </summary>
        string Name { get; }

        /// <summary>
        /// Gets the namespace of the type. For example for 'System.Object' this value would be 'System'.
        /// </summary>
        string NamespaceName { get; }

        /// <summary>
        /// Gets an object that describes further information about the type.
        /// </summary>
        ITypeInfo TypeInfo { get; }

        dynamic this[string fieldName] { get; }

        /// <summary>
        /// Gets the <see cref="IFieldDefinition"/> declared in the type with the given <paramref name="fieldName"/>.
        /// </summary>
        /// <param name="fieldName">
        /// The name of the field.
        /// </param>
        /// <param name="typeFullName">
        /// The name of the type in which the field is declared. In most cases this can be left <c>null</c>, however
        /// to access a private field in a subclass which has the same name as a field declared higher up in the
        /// hierarchy it is necessary to provide the full name of the declaring type.
        /// </param>
        /// <returns>
        /// The <see cref="IFieldDefinition"/> declared in the type with the given <paramref name="fieldName"/>.
        /// </returns>
        IFieldDefinition GetField(string fieldName, string typeFullName = default);

        /// <summary>
        /// Gets the value of a static field declared in the type.
        /// </summary>
        /// <typeparam name="TValue">
        /// The type of the value to get. If unsure of the type you can always use <see cref="object"/>.
        /// </typeparam>
        /// <param name="fieldName">
        /// The name of the static field.
        /// </param>
        /// <returns>
        /// The value of the static field.
        /// </returns>
        TValue GetStaticValue<TValue>(string fieldName);
    }
}