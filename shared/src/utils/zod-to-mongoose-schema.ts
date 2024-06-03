import { z } from 'zod'
import mongoose, { Schema, type ObjectId, type SchemaOptions, type Model } from 'mongoose'
import type { ConditionalKeys, TupleToUnion, Constructor, Simplify, Merge } from 'type-fest'
import type { StartsWith } from 'type-fest/source/internal'

type ObjectSchemaOptions<T extends z.AnyZodObject, V extends SchemaOptions = SchemaOptions> = V & {
  parent?: SchemaType<T, V>
}
type RawDocType<T extends z.AnyZodObject> = Merge<z.infer<T>, {
  _id: ObjectId
}>
type SchemaType<T extends z.AnyZodObject, U extends SchemaOptions> = Schema<
  RawDocType<T>,
  Model<RawDocType<T>>,
  {},
  {},
  {},
  U,
  RawDocType<T>
>

const typeNames = ['string', 'number', 'boolean', 'date', 'object', 'enum'] as const
type TypeName = TupleToUnion<typeof typeNames>
type FnKeyToClassKey<T extends string> =
  StartsWith<T, 'Zod'> extends true ? T : `Zod${Capitalize<T>}`
type SchemaTypeOptions<T extends string> = T extends AddZodName<'string'> | AddZodName<'enum'>
  ? mongoose.SchemaTypeOptions<string>
  : T extends AddZodName<'number'>
    ? mongoose.SchemaTypeOptions<number>
    : T extends AddZodName<'boolean'>
      ? mongoose.SchemaTypeOptions<boolean>
      : T extends AddZodName<'object'>
        ? mongoose.SchemaTypeOptions<Schema>
        : T extends AddZodName<'object[]'>
          ? mongoose.SchemaTypeOptions<Schema[]>
          : T extends AddZodName<'string[]'>
            ? mongoose.SchemaTypeOptions<string[]>
            : T extends AddZodName<'number[]'>
              ? mongoose.SchemaTypeOptions<number[]>
              : T extends AddZodName<'boolean[]'>
                ? mongoose.SchemaTypeOptions<boolean[]>
                : T extends AddZodName<'date'>
                  ? mongoose.SchemaTypeOptions<Date>
                  : mongoose.SchemaTypeOptions<unknown>

type Z = typeof z
type ZodKeys = keyof Z
type ZodTypeFactory = (...args: any[]) => z.ZodTypeAny
type ZodTypeClass = Constructor<z.ZodTypeAny>
type ZodTypeFn = Extract<Z[ZodKeys], ZodTypeFactory>

type ZodTypeFnKeys = Extract<
  ConditionalKeys<Z, ZodTypeFn>,
  'string' | 'number' | 'boolean' | 'object' | 'array' | 'enum' | 'date'
>

type ZodTypeClassKeys = Extract<
  ConditionalKeys<Z, ZodTypeClass>,
  'ZodDefault' | FnKeyToClassKey<ZodTypeFnKeys>
>

type ZodType<T extends ZodTypeFn | Z[ZodTypeClassKeys]> = T extends ZodTypeFactory
  ? ReturnType<T>
  : T extends Constructor<infer I>
    ? I
    : never

type ZodTypeKeys = ZodTypeFnKeys | ZodTypeClassKeys

type AddZodName<T extends ZodTypeKeys | `${ZodTypeKeys}[]`> = T | FnKeyToClassKey<T>

type ZodTypeToMongooseTypeFn<key extends ZodTypeKeys> =
  key extends AddZodName<'object'>
    ? <
        T extends z.AnyZodObject,
        U extends {
          [key: string]: SchemaTypeOptions<AddZodName<TypeName | `${TypeName}[]`>> | Schema
        },
        V extends SchemaOptions
      >(
        type: T,
        options?: ObjectSchemaOptions<T, V>
      ) => SchemaType<T, V> // Schema<any, Model<any>, {}, {}, {}, V, z.infer<T>>
    : key extends AddZodName<'array'>
      ? (
          type: ZodType<Z[key]>
        ) => SchemaTypeOptions<AddZodName<`${Exclude<TypeName, 'date' | 'enum'>}[]`>>
      : key extends 'ZodDefault'
        ? (
            type: ZodType<Z[key]>
          ) => SchemaTypeOptions<AddZodName<`${Exclude<TypeName, 'date' | 'enum'>}`>>
        : (type: ZodType<Z[key]>) => SchemaTypeOptions<key>

type ZodTypeToMongooseType = {
  [key in ZodTypeKeys]: ZodTypeToMongooseTypeFn<key>
}

const defaultSchemaTypeOptions = <
  T extends MongooseArrayValue,
  U extends SchemaTypeOptions<T['_def']['typeName']>
>(
  zodType: T
): U =>
  ({
    required: !zodType.isOptional(),
    nullable: zodType.isNullable(),
    default: zodType.safeParse(undefined).data,
    validate: {
      validator: (v: unknown) => zodType.safeParse(v).success
    }
  }) as unknown as U

type MongooseArrayItem =
  | typeof z.ZodObject<any>
  | typeof z.ZodString
  | typeof z.ZodNumber
  | typeof z.ZodBoolean
  | typeof z.ZodDate
  | typeof z.ZodEnum

type MongooseArrayValue = InstanceType<MongooseArrayItem>

const mongooseArraySchemaTypeMap: ReadonlyMap<
  MongooseArrayItem,
  (
    zodType: MongooseArrayValue,
    options?: ObjectSchemaOptions<z.AnyZodObject>
  ) => SchemaTypeOptions<MongooseArrayValue['_def']['typeName']>
  // @ts-ignore I know this should work
> = new Map([
  [
    z.ZodObject as MongooseArrayItem,
    (zodType, options) => zodTypeToMongooseType.object(zodType as z.AnyZodObject, options)
  ],
  [
    z.ZodString as MongooseArrayItem,
    (zodType) => zodTypeToMongooseType.string(zodType as z.ZodString)
  ],
  [
    z.ZodNumber as MongooseArrayItem,
    (zodType) => zodTypeToMongooseType.number(zodType as z.ZodNumber)
  ],
  [
    z.ZodBoolean as MongooseArrayItem,
    (zodType) => zodTypeToMongooseType.boolean(zodType as z.ZodBoolean)
  ]
])

const zodTypeToMongooseType: ZodTypeToMongooseType = {
  string: (zodType) => ({
    ...defaultSchemaTypeOptions(zodType),
    type: String,
    minlength: zodType.minLength ?? undefined,
    maxlength: zodType.maxLength ?? undefined
  }),
  ZodString: (zodType) => zodTypeToMongooseType.string(zodType),
  number: (zodType) => ({
    ...defaultSchemaTypeOptions(zodType),
    type: Number,
    minlength: zodType.minValue ?? undefined,
    maxlength: zodType.maxValue ?? undefined
  }),
  ZodNumber: (zodType) => zodTypeToMongooseType.number(zodType),
  boolean: (zodType) => ({
    ...defaultSchemaTypeOptions(zodType),
    type: Boolean
  }),
  ZodBoolean: (zodType) => zodTypeToMongooseType.boolean(zodType),
  array: (zodArray) => [
    mongooseArraySchemaTypeMap.get(zodArray.element.constructor as MongooseArrayItem)!(
      zodArray.element
    )
  ],
  ZodArray: (zodArray) => zodTypeToMongooseType.array(zodArray),
  enum: (zodEnum) => ({
    ...defaultSchemaTypeOptions(zodEnum),
    type: String,
    enum: zodEnum.options
  }),
  ZodEnum: (zodEnum) => zodTypeToMongooseType.enum(zodEnum),
  object: <
    T extends z.AnyZodObject,
    U extends { [key: string]: SchemaTypeOptions<keyof ZodTypeToMongooseType> | Schema },
    V extends SchemaOptions
  >(
    zodObject: T,
    options?: ObjectSchemaOptions<T, V>
  ): SchemaType<T, V> => {
    const docDef = Object.keys(zodObject.shape).reduce((acc, key) => {
      if (key === '_id') return acc

      const zodTypeName = zodObject.shape[key]._def.typeName as keyof ZodTypeToMongooseType

      const zodType = zodObject.shape[key] as Parameters<
        ZodTypeToMongooseType[typeof zodTypeName]
      >[0]

      const fn = zodTypeToMongooseType[zodTypeName] as (
        type: typeof zodType
      ) => SchemaTypeOptions<typeof zodTypeName> | Schema

      if (typeof fn !== 'function') {
        console.error(
          `No function found for ${zodTypeName} in ${JSON.stringify(zodTypeToMongooseType, null, 2)}`,
          fn
        )
        return acc
      }

      // const mongooseType = fn(zodType)

      // if (key === '_id' && 'type' in mongooseType && mongooseType.type === String) {
      //   mongooseType.required = true
      //   mongooseType.validate = undefined
      // }

      return { ...acc, [key]: fn(zodType) }
    }, {}) as U

    return new Schema(docDef as any, { ...options }) as SchemaType<T, V>
  },
  ZodObject: <
    T extends z.AnyZodObject,
    U extends { [key: string]: SchemaTypeOptions<keyof ZodTypeToMongooseType> | Schema },
    V extends SchemaOptions
  >(
    zodObject: T,
    options?: ObjectSchemaOptions<T, V>
  ): SchemaType<T, V> => zodTypeToMongooseType.object<T, U, V>(zodObject, options),
  date: (zodType) => ({
    ...defaultSchemaTypeOptions(zodType),
    type: Date,
    min: zodType.minDate ?? undefined,
    max: zodType.maxDate ?? undefined
  }),
  ZodDate: (zodDate) => zodTypeToMongooseType.date(zodDate),
  // @ts-ignore I know this should work
  ZodDefault: <T extends MongooseArrayValue>(zodType: z.ZodDefault<T>) => {
    const { innerType, defaultValue: defaultValueFn } = zodType._def

    const defaultValue = defaultValueFn()

    const result: SchemaTypeOptions<typeof innerType._def.typeName> = {
      ...zodTypeToMongooseType[innerType._def.typeName](innerType as any),
      default: defaultValue as any
    }

    return result
  },
  ZodOptional: <T extends MongooseArrayValue>(zodType: z.ZodOptional<T>) => {
    const { innerType } = zodType._def

    return {
      ...zodTypeToMongooseType[innerType._def.typeName](innerType as any),
      optional: true
    } as SchemaTypeOptions<typeof innerType._def.typeName>
  }
}

export default function zodSchemaToMongooseSchema<
  T extends z.AnyZodObject,
  U extends SchemaOptions
>(zodSchema: T, options?: U): SchemaType<T, U> {
  return zodTypeToMongooseType.object(zodSchema, options)
}

// Example usage:
// const FeedbackSchema = zodSchemaToMongooseSchema(feedbackFormSchema, { strict: true })
// const FeedbackModel = mongoose.model('Feedback', FeedbackSchema)
