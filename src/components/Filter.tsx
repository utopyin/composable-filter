"use client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as SelectPrimitive from "@radix-ui/react-select";
import { produce } from "immer";
import get from "lodash.get";
import set from "lodash.set";
import { ChevronDown, ChevronDownIcon, PlusIcon } from "lucide-react";
import React, { useCallback, useMemo } from "react";
import { cn } from "../lib/utils";
import { Button, buttonVariants } from "./ui/button";
import { Input } from "./ui/input";

function fixedForwardRef<T, P = {}>(
  render: (props: P, ref: React.Ref<T>) => React.ReactNode,
): (props: P & React.RefAttributes<T>) => React.ReactNode {
  return React.forwardRef(render as any) as any;
}

type BaseFilter<Operators extends string[], Fields extends string[]> =
  | {
      or: Array<BaseFilter<Operators, Fields>>;
      and?: undefined;
    }
  | {
      or?: undefined;
      and: Array<BaseFilter<Operators, Fields>>;
    }
  | {
      id: string;
      field: Fields[number];
      operator: Operators[number];
      value: string;
      and?: undefined;
      or?: undefined;
    };

type FilterProps<
  Operators extends Array<string>,
  Fields extends Array<string>,
> = {
  filter?: BaseFilter<Operators, Fields>;
  operators: Operators;
  fields: Fields;
};

const Filter = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>
>((props, ref) => {
  return <PopoverPrimitive.Root {...props} />;
});

const FilterTrigger = PopoverPrimitive.Trigger;

const FilterAnchor = PopoverPrimitive.Anchor;

const FilterContext = React.createContext<{
  fields: string[];
  operators: string[];
  setFilter: (
    recipe: (
      filter: BaseFilter<string[], string[]>,
    ) => void | BaseFilter<string[], string[]>,
  ) => void;
} | null>(null);

const FilterContent = <A extends string[], B extends string[]>(
  {
    filter: filter_,
    fields,
    operators,
    className,
    align = "center",
    sideOffset = 4,
    ...props
  }: FilterProps<A, B> &
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>,
  ref: React.ForwardedRef<HTMLDivElement>,
) => {
  const [filter, setFilter] = React.useState<BaseFilter<A, B>>(
    filter_ ?? {
      or: [],
    },
  );

  const setFilter_ = useMemo(() => {
    return (recipe: (filter: BaseFilter<A, B>) => BaseFilter<A, B> | void) =>
      setFilter((old) => produce(old, recipe));
  }, [setFilter]);

  const addFilter = useCallback(() => {}, [fields, operators]);

  return (
    <FilterContext.Provider
      value={{ fields, operators, setFilter: setFilter_ }}
    >
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={sideOffset}
          style={{
            maxWidth:
              "calc(var(--radix-popover-content-available-width) - 20px)",
            maxHeight:
              "calc(var(--radix-popover-content-available-height) - 10px)",
          }}
          className={cn(
            "z-50 overflow-scroll rounded-xl border bg-popover p-1 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className,
          )}
          ref={ref}
          {...props}
        >
          <FilterGroup
            path={[]}
            condition={filter.and ? "and" : filter.or ? "or" : undefined}
            group={filter.or ?? filter.and ?? [filter]}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </FilterContext.Provider>
  );
};

type Path = (Condition | number)[];
const FilterGroup = <A extends string[], B extends string[]>({
  condition,
  group,
  path,
}: {
  path: Path;
  condition?: Condition;
  group: BaseFilter<A, B>[];
}) => {
  const { setFilter } = React.useContext(FilterContext)!;

  const setItem = useCallback(
    (key: "field" | "operator" | "value" | "condition", value: string) => {
      const slicedPath = path;
      if (key == "condition") {
        return setFilter((filter) => {
          const oldFilter = get(filter, [...slicedPath, condition!]);
          if (value == "and" || value == "or") {
            if (slicedPath.length == 0) {
              return {
                [value]: oldFilter,
              } as BaseFilter<A, B>;
            } else {
              set(filter, slicedPath, {
                [value]: oldFilter,
              });
            }
          }
        });
      }
      setFilter((filter) => {
        const oldFilter = get(filter, slicedPath);
        set(filter, slicedPath, {
          ...oldFilter,
          [key]: value,
        });
      });
    },
    [setFilter, path],
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg p-2",
        path.length > 0 && `border bg-gray-500/5`,
      )}
      style={{
        gridColumn: "property-start / value-end",
      }}
    >
      <div
        style={{
          gridAutoRows: "minmax(32px, auto)",
          gridTemplateColumns:
            "[boolean-start] min-content [boolean-end property-start] minmax(min-content, 120px) [property-end operator-start] 110px [operator-end value-start] auto [value-end menu-start] 32px [menu-end]",
        }}
        className="grid gap-2 text-sm"
      >
        {group.map((filter, index) => {
          if (condition) {
            return (
              <React.Fragment key={getIdFromFilter(filter)}>
                {index == 0 ? (
                  <span className="justify-self-end pr-1 leading-8">Where</span>
                ) : index == 1 ? (
                  <Select
                    onChange={setItem.bind(null, "condition")}
                    defaultValue={condition}
                    capitalize
                    className="h-8 px-3"
                    options={["or", "and"]}
                  />
                ) : (
                  <span className="justify-self-end pr-1 capitalize leading-8">
                    {condition}
                  </span>
                )}
                <FilterRow path={[...path, condition, index]} filter={filter} />
                <Button variant={"ghost"} className="h-8 w-8" size={"icon"}>
                  <DotsHorizontalIcon />
                </Button>
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={getIdFromFilter(filter)}>
              <span className="justify-self-end pr-1 leading-8">Where</span>
              <FilterRow path={[...path, index]} filter={filter} />
              <Button>
                <DotsHorizontalIcon />
              </Button>
            </React.Fragment>
          );
        })}
      </div>
      <Button
        variant={"ghost"}
        // onClick={addFilter}
        className="flex w-full items-center justify-start gap-1 px-1 py-0 font-normal text-muted-foreground transition-colors hover:bg-transparent hover:text-muted-foreground/70"
      >
        <PlusIcon className="h-5 w-5 stroke-[1.75]" />
        Add filter rule
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
};

const getIdFromFilter = (filter: BaseFilter<string[], string[]>): string => {
  if ("or" in filter && filter.or) {
    return `group-${filter.or.map(getIdFromFilter).join("")}`;
  }
  if ("and" in filter && filter.and) {
    return `group-${filter.and.map(getIdFromFilter).join("")}`;
  }
  return filter.id;
};

type Condition = "or" | "and";

const FilterRow = <A extends string[], B extends string[]>({
  filter,
  path,
}: Omit<Required<FilterProps<A, B>>, "fields" | "operators"> & {
  path: Path;
}) => {
  const { setFilter, fields, operators } = React.useContext(FilterContext)!;

  const setItem = useCallback(
    (key: "field" | "operator" | "value" | "condition", value: string) => {
      if (key == "condition") {
        return setFilter((filter) => {
          const previousPath = path.slice(0, -1);
          const oldFilter = get(filter, path);
          set(filter, previousPath, {
            [value]: oldFilter,
          });
        });
      }
      setFilter((filter) => {
        const oldFilter = get(filter, path);
        set(filter, path, {
          ...oldFilter,
          [key]: value,
        });
      });
    },
    [setFilter, path],
  );

  if ("or" in filter && filter.or) {
    return (
      <FilterGroup path={path} group={filter.or} condition="or"></FilterGroup>
    );
  }
  if ("and" in filter && filter.and) {
    return (
      <FilterGroup
        path={[...path]}
        group={filter.and}
        condition="and"
      ></FilterGroup>
    );
  }

  return (
    <>
      <Select
        className="h-8 justify-between px-3"
        onChange={setItem.bind(null, "field")}
        defaultValue={filter?.field}
        options={fields}
      />
      <div className="flex gap-2" style={{ gridColumnEnd: "span 2" }}>
        <Select
          className="h-8 px-3"
          onChange={setItem.bind(null, "operator")}
          defaultValue={filter?.operator}
          options={operators}
        />
        <Input
          onChange={(e) => setItem("value", e.target.value)}
          defaultValue={filter?.value}
          placeholder="Value"
          className="h-8 w-full px-3"
          type="text"
        />
      </div>
    </>
  );
};
const ForwardedFilterContent = fixedForwardRef(FilterContent);

FilterContent.displayName = PopoverPrimitive.Content.displayName;

function Select<Option extends string>({
  defaultValue,
  options,
  onChange,
  children,
  capitalize = false,
  className,
}: {
  defaultValue?: Option;
  options: Option[];
  onChange?: (option: Option) => void;
  children?: React.ReactNode;
  capitalize?: boolean;
  className?: string;
}) {
  return (
    <SelectPrimitive.Root
      defaultValue={defaultValue ?? options[0]}
      onValueChange={(option) => onChange?.(option as Option)}
    >
      <SelectPrimitive.Trigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "flex justify-start gap-1.5 font-normal",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder="Select" />
        <SelectPrimitive.Icon>
          <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          className={cn(
            "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          )}
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={`select-item-${option}`}
                className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-secondary focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                value={option}
              >
                <SelectPrimitive.ItemText className="capitalize">
                  {capitalize ? (
                    <span className="capitalize">{option}</span>
                  ) : (
                    option
                  )}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator />
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export {
  Filter,
  FilterAnchor,
  ForwardedFilterContent as FilterContent,
  FilterTrigger,
};
