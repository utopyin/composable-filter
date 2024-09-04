import { SlidersHorizontal } from "lucide-react";
import { Filter, FilterContent, FilterTrigger } from "./components/Filter";
import { Button } from "./components/ui/button";

function App() {
  return (
    <div className="flex h-full min-h-screen w-full items-center justify-center">
      <Filter>
        <FilterTrigger asChild>
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
        </FilterTrigger>
        <FilterContent
          fields={
            [
              "Ages",
              "Name",
            ] as const
          }
          operators={
            ["is", "is not", "is greater than", "is less than"] as const
          }
          filter={{
            and: [
              {
                id: "1",
                field:
                  "Ages",
                operator: "is less than",
                value: "",
              },
              {
                or: [
                  {
                    id: "2",
                    field:
                      "Ages",
                    operator: "is",
                    value: "",
                  },
                  {
                    and: [
                      {
                        id: "3",
                        field: "Name",
                        operator: "is greater than",
                        value: "",
                      },
                      {
                        id: "4",
                        field:
                          "Ages",
                        operator: "is not",
                        value: "",
                      },
                    ],
                  },
                ],
              },
            ],
          }}
        />
      </Filter>
    </div>
  );
}

export default App;
