export type Condition = "or" | "and";

export type Path = (Condition | number)[];

export type DefaultField = { name: string; operators: string[] };
export type DefaultReadonlyField = {
  name: string;
  operators: readonly string[];
};

export type BaseFilter<
  Fields extends DefaultField[] | readonly DefaultReadonlyField[],
  FieldName extends string = Fields[number]["name"],
> =
  | {
      id: string;
      or: Array<BaseFilter<Fields, FieldName>>;
      and?: undefined;
    }
  | {
      id: string;
      or?: undefined;
      and: Array<BaseFilter<Fields, FieldName>>;
    }
  | {
      id: string;
      operator: OperatorForName<Fields[number], FieldName> extends never
        ? string
        : OperatorForName<Fields[number], FieldName>;
      field: FieldName;
      value: string;
      and?: undefined;
      or?: undefined;
    };

export type DefaultBaseFilter = BaseFilter<
  DefaultField[] | readonly DefaultReadonlyField[]
>;
type OperatorForName<
  T extends DefaultField | DefaultReadonlyField,
  N extends string,
> = T extends { name: N; operators: infer O extends string[] }
  ? O[number]
  : never;

export type FilterProps<
  Fields extends DefaultField[] | readonly DefaultReadonlyField[],
  FieldName extends Fields[number]["name"],
> = {
  fields: Fields;
  filter: BaseFilter<Fields, FieldName>;
};
