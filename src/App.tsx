import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Filter, FilterContent, FilterTrigger } from "./components/Filter";
import { Button } from "./components/ui/button";
import { ThemeProvider } from "@/components/theme-provider";
import { BaseFilter } from "./components/Filter/types";

const fields = [
  { name: "Age", operators: ["is", "is not"] },
  { name: "Ages", operators: ["are"] },
] as const;

function App() {
  const [id, setId] = useState(0);
  const [filter, setFilter] = useState<BaseFilter<typeof fields>>({
    id: "1",
    value: "",
    field: "Age",
    operator: "is",
  });

  return (
    <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
      <div className="flex h-full min-h-screen w-full items-center justify-center text-foreground">
        <Filter>
          <FilterTrigger asChild>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </FilterTrigger>
          <FilterContent
            onChange={(filter, oldFilter) => {
              // console.log("Filter changed", filter);
            }}
            fields={fields}
            filter={filter}
          />
        </Filter>
      </div>
    </ThemeProvider>
  );
}

export default App;
