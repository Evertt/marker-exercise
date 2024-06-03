import './array'
type ValidEnumKeys = string | `${number}`
type ValidEnumValues = string | number

type ValidEnumObject = Readonly<Record<ValidEnumKeys, ValidEnumValues>>
type ValidEnumArray = readonly ValidEnumValues[]
type ValidEnumType = ValidEnumObject // | ValidEnumArray

export default function makeEnumObject<EnumObjectType extends ValidEnumType>(
  enumObject: EnumObjectType
) {
  type EnumType = EnumObjectType extends ValidEnumArray
    ? Omit<EnumObjectType, keyof EnumObjectMethods> & EnumObjectMethods
    : EnumObjectType & EnumObjectMethods

  const enumType = enumObject as EnumType

  type EnumObjectMethods = Readonly<{
    [key in keyof typeof enumObjectMethods]: (typeof enumObjectMethods)[key]['value']
  }>

  const enumObjectMethods = {
    keys: {
      value: function (this: EnumObjectType) {
        if (Array.isArray(this)) {
          return this.arrayKeys() as ObjectKeysTuple
        }

        return Object.keys(this) as ObjectKeysTuple
      }.bind(enumObject),
      enumerable: false
    },
    values: {
      value: function (this: EnumObjectType) {
        if (Array.isArray(this)) return this.valueOf() as EnumObjectValues[]
        return Object.values(this) as EnumObjectValues[]
      }.bind(enumObject),
      enumerable: false
    }
  } as const

  Object.defineProperties(enumType, enumObjectMethods)

  type EnumObjectKeys = EnumObjectType extends ValidEnumArray
    ? number
    : Exclude<keyof EnumObjectType, keyof EnumObjectMethods>

  type ObjectKeysTuple = EnumObjectKeys[] extends (infer T)[] ? [T, ...T[]] : never

  type EnumObjectValues = EnumObjectType extends ValidEnumArray
    ? number
    : Exclude<keyof EnumObjectType, keyof EnumObjectMethods>

  return enumType
}
