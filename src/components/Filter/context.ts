import { createContext } from "react";
import { BaseFilter, DefaultField, DefaultReadonlyField } from "./types";
import { Producer } from "immer";

export const FilterContext = createContext<{
  isMeasuring: boolean;
  setIsMeasuring: React.Dispatch<React.SetStateAction<boolean>>;
  filter: BaseFilter<DefaultField[]>;
  fields: DefaultField[] | readonly DefaultReadonlyField[];
  setFilter: (
    recipe: Producer<
      BaseFilter<DefaultField[] | readonly DefaultReadonlyField[], string>
    >,
  ) => void;
} | null>(null);
