import { DefaultBaseFilter, Path } from "./types";
import { nanoid } from "nanoid";

export const calculateFilterGroupHeight = (
  group: DefaultBaseFilter[],
): number => {
  return (
    // y padding of group
    12 +
    // add button
    36 +
    // gap of add button
    8 +
    // gap of each filter
    (group.length - 1) * 8 +
    // height of each filter
    group.reduce((groupAcc, filter) => {
      // if the filter is a group, add the height of the group
      if (filter.or || filter.and) {
        // add 2 for the group's border (only child groups have a border)
        return (
          groupAcc + 2 + calculateFilterGroupHeight(filter.or ?? filter.and)
        );
      }
      // add 32 for the height of a single filter
      return groupAcc + 32;
    }, 0)
  );
};

export const getIdFromFilter = (
  filter: DefaultBaseFilter | DefaultBaseFilter[],
): string => {
  if ("or" in filter && filter.or) {
    return `group-${filter.or.map(getIdFromFilter).join("-")}`;
  }
  if ("and" in filter && filter.and) {
    return `group-${filter.and.map(getIdFromFilter).join("-")}`;
  }
  if (Array.isArray(filter)) {
    return `group-${filter.map(getIdFromFilter).join("-")}`;
  }
  return filter.id;
};

export const getKeyFromPath = (path: Path) =>
  path.length
    ? path.map((p) => (p == "and" || p == "or" ? "condition" : p)).join("-")
    : "root";

export const generateFilterId = () => nanoid();

// path.length ? get(filter, path).id : filter.id

export const calculateFilterWidth = (filter: DefaultBaseFilter): number => {
  return 0;
};
