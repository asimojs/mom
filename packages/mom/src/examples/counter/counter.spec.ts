import { mom } from "../../mom";
import { describe, expect, it } from "vitest";
import { Counter } from "./counter";

describe("Counter", () => {
  it("should load", async () => {
    const counter = mom.load({ $cpt: Counter, value: 42 });

    expect(counter.nbrOfChanges).toBe(0);

    counter.$actions.increment();
    expect(counter.$props.value).toBe(43);
    expect(counter.nbrOfChanges).toBe(1);

    // counter.nbrOfChanges=2; // not possible -> nbrOfChanges is readonly
    counter.$props.value = 42;
  });
});
