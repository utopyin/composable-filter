"use client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  MotionConfig,
  MotionProps,
  Variants,
} from "framer-motion";
import { produce, Producer } from "immer";
import get from "lodash.get";
import set from "lodash.set";
import {
  ArrowUp,
  ChevronDown,
  Copy,
  CopyPlus,
  CornerDownLeft,
  Folder,
  FolderPlus,
  Group,
  Maximize2,
  Minimize,
  Minimize2,
  PlusIcon,
  RefreshCcw,
  RefreshCw,
  RotateCcwSquare,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  SelectContent,
  SelectItem,
  Select as SelectProvider,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { FilterContext } from "./context";
import {
  BaseFilter,
  Condition,
  DefaultBaseFilter,
  DefaultField,
  DefaultReadonlyField,
  FilterProps,
  Path,
} from "./types";
import {
  calculateFilterGroupHeight,
  calculateFilterWidth,
  generateFilterId,
  getKeyFromPath,
} from "./utils";
import useMeasure from "react-use-measure";

const MotionButton = motion.create(Button);
const MotionSelectValue = motion.create(SelectValue);
const MotionInput = motion.create(Input);
const MotionSelectTrigger = motion.create(SelectTrigger);

const fadeIn: Variants = {
  initial: {
    opacity: 0,
    y: -10,
    filter: "blur(3px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",

    transition: {
      opacity: {
        duration: 0.2,
        type: "spring",
        bounce: 0,
      },
      duration: 0.25,
      type: "spring",
      bounce: 0,
    },
  },
  exit: {
    opacity: 0,
    y: -15,
    filter: "blur(2px)",
    // transition: { duration: 1, type: "spring", bounce: 0 },
  },
};

function fixedForwardRef<T, P = {}>(
  render: (props: P, ref: React.Ref<T>) => React.ReactNode,
): (props: P & React.RefAttributes<T>) => React.ReactNode {
  return React.forwardRef(render as any) as any;
}

const FilterContent = <
  Fields extends DefaultField[] | readonly DefaultReadonlyField[],
  FieldName extends Fields[number]["name"] = Fields[number]["name"],
>(
  {
    filter: filter_ = { id: generateFilterId(), or: [] },
    fields,
    className,
    align = "center",
    sideOffset = 4,
    onChange,
    ...props
  }: FilterProps<Fields, FieldName> &
    Omit<React.ComponentPropsWithoutRef<typeof PopoverContent>, "onChange"> & {
      onChange?: (
        filter: BaseFilter<Fields, FieldName>,
        oldFilter: BaseFilter<Fields, FieldName>,
      ) => void;
    },
  ref: React.ForwardedRef<HTMLDivElement>,
) => {
  const [isMeasuring, setIsMeasuring] = React.useState(false);
  const [filter, setFilter] = React.useState<BaseFilter<Fields, FieldName>>(
    !filter_.or && !filter_.and
      ? { id: generateFilterId(), or: [filter_] }
      : filter_,
  );

  const setFilter_ = useMemo(() => {
    return (recipe: Producer<DefaultBaseFilter>) =>
      setFilter((old) => {
        const result = produce(old, recipe);
        onChange?.(result, old);
        return result;
      });
  }, [setFilter, onChange]);

  return (
    <MotionConfig transition={{ type: "spring", bounce: 0, duration: 0.2 }}>
      <FilterContext.Provider
        value={{
          isMeasuring,
          setIsMeasuring,
          filter,
          fields,
          setFilter: setFilter_,
        }}
      >
        <PopoverContent
          ref={ref}
          align={align}
          sideOffset={sideOffset}
          style={{
            maxWidth:
              "calc(var(--radix-popover-content-available-width) - 20px)",
            maxHeight:
              "calc(var(--radix-popover-content-available-height) - 10px)",
          }}
          className={cn(
            "z-50 w-max overflow-scroll p-1 transition-all",
            className,
          )}
          {...props}
        >
          <FilterGroup
            condition={filter.and ? "and" : filter.or ? "or" : undefined}
            group={filter.or ?? filter.and ?? [filter]}
          />
        </PopoverContent>
      </FilterContext.Provider>
    </MotionConfig>
  );
};

FilterContent.displayName = PopoverContent.displayName;
const ForwardedFilterContent = fixedForwardRef(FilterContent);

const FilterGroup = <
  Fields extends DefaultField[] | readonly DefaultReadonlyField[],
  FieldName extends string,
>({
  condition,
  group,
  path = [],
}: {
  path?: Path;
  condition?: Condition;
  group: BaseFilter<Fields, FieldName>[];
}) => {
  const [measureRef, bounds] = useMeasure();
  const { setFilter, fields, filter } = React.useContext(FilterContext)!;

  const oldFilter = useRef(filter);

  useEffect(() => {
    oldFilter.current = filter;
  }, [filter, path]);

  const setCondition = useCallback(
    (value: string) => {
      return setFilter((filter) => {
        const oldFilter = get(filter, [...path, condition!]);
        if (value == "and" || value == "or") {
          if (path.length == 0) {
            return {
              [value]: oldFilter,
            } as BaseFilter<Fields, FieldName>;
          } else {
            set(filter, path, {
              [value]: oldFilter,
            });
          }
        }
      });
    },
    [setFilter, path],
  );

  const addFilter = useCallback(
    (type: "single" | "group") => {
      return setFilter((oldFilter) => {
        const newFilter =
          type == "single"
            ? {
                id: generateFilterId(),
                field: fields[0].name,
                operator: fields[0].operators[0],
                value: "",
              }
            : {
                id: generateFilterId(),
                or: [
                  {
                    id: generateFilterId(),
                    field: fields[0].name,
                    operator: fields[0].operators[0],
                    value: "",
                  },
                ],
              };

        let filterAtPath = path.length == 0 ? oldFilter : get(oldFilter, path);

        if (filterAtPath.or) {
          filterAtPath.or.push(newFilter);
        } else if (filterAtPath.and) {
          filterAtPath.and.push(newFilter);
        } else {
          const newFilterGroup = {
            id: generateFilterId(),
            or: [filterAtPath, newFilter],
          };

          if (path.length == 0) return newFilterGroup;
          filterAtPath = newFilterGroup;
        }
      });
    },
    [setFilter, path, fields],
  );

  const duplicateFilter = useCallback(
    ({
      filter,
      index,
    }: {
      filter: BaseFilter<Fields, FieldName>;
      index: number;
    }) => {
      return setFilter((oldFilter) => {
        const newFilter = {
          ...filter,
          id: generateFilterId(),
        };
        let filterAtPath = path.length == 0 ? oldFilter : get(oldFilter, path);

        if (filterAtPath.or) {
          filterAtPath.or.splice(index, 0, newFilter);
        } else if (filterAtPath.and) {
          filterAtPath.and.splice(index, 0, newFilter);
        } else {
          const newFilterGroup = {
            id: generateFilterId(),
            or: [filterAtPath, newFilter],
          };

          if (path.length == 0) return newFilterGroup;
          filterAtPath = newFilterGroup;
        }
      });
    },
    [setFilter, path],
  );

  const turnIntoGroup = useCallback(
    (index: number) => {
      return setFilter((oldFilter) => {
        let filterAtPath = path.length == 0 ? oldFilter : get(oldFilter, path);

        if (filterAtPath.or) {
          const newFilterGroup = {
            id: generateFilterId(),
            or: [filterAtPath.or[index]],
          };
          filterAtPath.or[index] = newFilterGroup;
        } else if (filterAtPath.and) {
          const newFilterGroup = {
            id: generateFilterId(),
            or: [filterAtPath.and[index]],
          };
          filterAtPath.and[index] = newFilterGroup;
        }
      });
    },
    [setFilter, path],
  );

  const unwrapGroup = useCallback(
    (index: number) => {
      return setFilter((oldFilter) => {
        let filterAtPath = path.length == 0 ? oldFilter : get(oldFilter, path);

        if (filterAtPath.or) {
          filterAtPath.or[index] = {
            ...filterAtPath.or[index].or![0],
            id: filterAtPath.or[index].id,
          };
        } else if (filterAtPath.and) {
          filterAtPath.and[index] = {
            ...filterAtPath.and[index].or![0],
            id: filterAtPath.and[index].id,
          };
        }
      });
    },
    [setFilter, path],
  );

  const removeFilter = useCallback(
    (index: number) => {
      return setFilter((oldFilter) => {
        let filterAtPath = path.length == 0 ? oldFilter : get(oldFilter, path);

        if (filterAtPath.or?.length == 1 || filterAtPath.and?.length == 1) {
          if (path.length == 0) {
            return filterAtPath.or
              ? { ...filterAtPath.or[0], id: filterAtPath.id }
              : { ...filterAtPath.and![0], id: filterAtPath.id };
          }
          set(
            oldFilter,
            path,
            filterAtPath.or
              ? { ...filterAtPath.or[0], id: filterAtPath.id }
              : { ...filterAtPath.and![0], id: filterAtPath.id },
          );
        }

        if (filterAtPath.or) {
          filterAtPath.or.splice(index, 1);
        } else if (filterAtPath.and) {
          filterAtPath.and.splice(index, 1);
        } else {
          const newFilterGroup = {
            id: generateFilterId(),
            or: [filterAtPath],
          };

          if (path.length == 0) return newFilterGroup;
          filterAtPath = newFilterGroup;
        }
      });
    },
    [setFilter, path],
  );

  const FilterRowMenu = useMemo<
    React.FC<{
      filter: BaseFilter<Fields, FieldName>;
      index: number;
      group: BaseFilter<Fields, FieldName>[];
    }>
  >(
    () =>
      ({ filter, index, group }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MotionButton
                // variants={fadeIn}
                // initial="initial"
                // animate="animate"
                // exit="exit"
                variant={"ghost"}
                className="h-8 w-8"
                size={"icon"}
              >
                <DotsHorizontalIcon />
              </MotionButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {!(path.length == 0 && group.length == 1) && (
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer focus:text-destructive-text",
                    group.length == 1 && "focus:text-accent-foreground",
                  )}
                  onClick={() => removeFilter(index)}
                >
                  {group.length == 1 ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {group.length == 1
                    ? "Move out of group"
                    : filter.and || filter.or
                      ? "Remove group"
                      : "Remove"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() =>
                  duplicateFilter({
                    filter,
                    index: index + 1,
                  })
                }
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => turnIntoGroup(index)}
              >
                <RefreshCw className="h-4 w-4" />
                Turn into group
              </DropdownMenuItem>
              {(filter.and || filter.or) && (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => unwrapGroup(index)}
                >
                  <Maximize2 className="h-4 w-4" />
                  Unwrap group
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    [],
  );

  if (path.length && !get(filter, path)) {
    console.log("oops!");
    // console.log(oldFilter.current);
    // console.log();
    // return null;
  }

  return (
    <motion.div
      style={{
        gridColumn: "field-start / value-end",
        // transition: "height 300ms cubic-bezier(.215, .61, .355, 1)",
      }}
      animate={{
        height: calculateFilterGroupHeight(group),
        // width: calculateFilterWidth(path.length ? get(filter, path) : filter),
      }}
      className={cn("rounded-lg", path.length > 0 && `border bg-gray-500/5`)}
    >
      <motion.div
        // ref={measureRef}
        key={path.length ? get(filter, path)?.id : filter.id}
        // id={path.length ? get(filter, path).id : filter.id}
        className="flex w-max flex-col gap-2 p-2 pb-1 text-sm"
      >
        <LayoutGroup>
          <AnimatePresence initial={false} mode="popLayout">
            {group.map((filter, index) => {
              if (condition) {
                return (
                  <motion.div
                    layout="position"
                    variants={fadeIn}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="grid gap-2"
                    style={{
                      gridAutoRows: "minmax(32px, auto)",
                      gridTemplateColumns:
                        "[boolean-start] 76px [boolean-end field-start] min-content [field-end operator-start] min-content [operator-end value-start] 1fr [value-end menu-start] 32px [menu-end]",
                    }}
                    key={filter.id}
                  >
                    {index == 0 ? (
                      <motion.span
                        key={filter.id + "condition"}
                        className="justify-self-end pr-1 leading-8"
                      >
                        Where
                      </motion.span>
                    ) : index == 1 ? (
                      <Select
                        onChange={setCondition}
                        defaultValue={condition}
                        capitalize
                        className="h-8 justify-between px-3"
                        options={["or", "and"]}
                      />
                    ) : (
                      <motion.div className="flex h-8 w-full items-center justify-end">
                        <motion.span layout={false} className="pr-1 capitalize">
                          {condition}
                        </motion.span>
                      </motion.div>
                    )}
                    <FilterRow
                      path={[...path, condition, index]}
                      filter={filter}
                    />
                    <FilterRowMenu
                      group={group}
                      index={index}
                      filter={filter}
                    />
                  </motion.div>
                );
              }

              return (
                // pass the index so that the key matches when this becomes a group
                <motion.div key={getKeyFromPath(path) + index}>
                  <motion.span
                    // variants={fadeIn}
                    // initial="initial"
                    // animate="animate"
                    // exit="exit"
                    className="justify-self-end pr-1 leading-8"
                  >
                    Where
                  </motion.span>
                  <FilterRow path={[...path]} filter={filter} />
                  <FilterRowMenu group={group} index={index} filter={filter} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </LayoutGroup>
        <SelectProvider value="" onValueChange={addFilter}>
          <MotionSelectTrigger
            layout="position"
            className={cn(
              "absolute bottom-2 flex w-min cursor-pointer items-center justify-start gap-1 border-none bg-transparent px-1 py-0 font-normal text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-muted-foreground/70 focus:ring-0",
              path.length > 0 && "bottom-1.5",
            )}
          >
            <PlusIcon className="h-5 w-5 stroke-[1.75]" />
            Add filter rule
          </MotionSelectTrigger>
          <SelectContent className="min-w-max">
            <SelectItem className="cursor-pointer" value="single">
              <div className="flex items-center gap-2">
                <PlusIcon className="h-5 w-5 stroke-[1.75]" />
                Add filter rule
              </div>
            </SelectItem>
            <SelectItem className="cursor-pointer" value="group">
              <div className="flex items-start gap-2">
                <CopyPlus className="h-5 w-5 stroke-[1.75]" />
                <div className="flex flex-col">
                  <p>Add filter group</p>
                  <p className="text-xs text-muted-foreground">
                    A group to nest more filters
                  </p>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </SelectProvider>
      </motion.div>
    </motion.div>
  );
};

const FilterRow = <
  Fields extends DefaultField[] | readonly DefaultReadonlyField[],
  FieldName extends string,
>({
  filter,
  path,
}: Omit<Required<FilterProps<Fields, FieldName>>, "fields" | "operators"> & {
  path: Path;
}) => {
  const { setFilter, fields } = React.useContext(FilterContext)!;

  const setItem = useCallback(
    (key: "field" | "operator" | "value" | "condition", value: string) => {
      setFilter((filter) => {
        const oldFilter = get(filter, path);

        if (key == "condition") {
          const previousPath = path.slice(0, -1);
          set(filter, previousPath, {
            [value]: oldFilter,
          });
        } else if (key == "field") {
          if (path.length == 0) {
            return {
              ...filter,
              field: value,
              operator: fields.find((field) => field.name == value)
                ?.operators[0]!,
            };
          }
          set(filter, path, {
            ...oldFilter,
            field: value,
            operator: fields.find((field) => field.name == value)?.operators[0],
          });
        } else if (key == "value" || key == "operator") {
          if (path.length == 0) {
            return {
              ...filter,
              [key]: value,
            };
          }
          set(filter, path, {
            ...oldFilter,
            [key]: value,
          });
        }
      });
    },
    [setFilter, path],
  );

  if (("or" in filter && filter.or) || ("and" in filter && filter.and)) {
    return (
      <FilterGroup
        path={path}
        group={filter.or || filter.and}
        condition={filter.or ? "or" : "and"}
      ></FilterGroup>
    );
  }

  return (
    <>
      <Select
        // motionProps={{
        //   variants: fadeIn,
        //   initial: "initial",
        //   animate: "animate",
        //   exit: "exit",
        // }}
        className="h-8 justify-between px-3"
        onChange={setItem.bind(null, "field")}
        defaultValue={filter?.field}
        options={fields.map((field) => field.name)}
      />
      <motion.div
      // variants={fadeIn}
      // initial="initial"
      // animate="animate"
      // exit={"exit"}
      >
        <Select
          key={`${filter.id}-${filter.field}-operator`}
          className="h-8 justify-between px-3"
          onChange={setItem.bind(null, "operator")}
          defaultValue={filter.operator}
          disabled={!fields.find((field) => field.name == filter.field)}
          options={
            fields.find((field) => field.name == filter.field)?.operators ?? []
          }
        />
      </motion.div>
      <MotionInput
        // variants={fadeIn}
        // initial="initial"
        // animate="animate"
        // exit="exit"
        onChange={(e) => setItem("value", e.target.value)}
        defaultValue={filter?.value}
        placeholder="Value"
        className="h-8 w-full min-w-32 px-3"
        type="text"
      />
    </>
  );
};

const Select = <Option extends string>({
  defaultValue,
  options,
  disabled,
  onChange,
  capitalize = false,
  className,
  motionProps,
}: {
  disabled?: boolean;
  defaultValue?: Option;
  options: Option[] | readonly Option[];
  onChange?: (option: Option) => void;
  capitalize?: boolean;
  className?: string;
  motionProps?: MotionProps & { key?: string };
}) => {
  return (
    <SelectProvider
      defaultValue={defaultValue ?? options[0]}
      disabled={disabled}
      onValueChange={(option) => {
        onChange?.(option as Option);
      }}
    >
      <SelectTrigger asChild>
        <MotionButton
          variant="outline"
          className={cn("flex justify-start gap-1.5 font-normal", className)}
          key={motionProps?.key}
          {...motionProps}
        >
          <MotionSelectValue
            layout={motionProps?.layout ? "position" : false}
            placeholder="Select"
          />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SelectPrimitive.Icon>
        </MotionButton>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={`select-item-${option}`} value={option}>
            {capitalize ? <span className="capitalize">{option}</span> : option}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectProvider>
  );
};

export {
  Popover as Filter,
  PopoverAnchor as FilterAnchor,
  ForwardedFilterContent as FilterContent,
  PopoverTrigger as FilterTrigger,
};
