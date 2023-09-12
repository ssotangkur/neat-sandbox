import { render, screen } from "@testing-library/react";
import { SampleComponent } from "./SampleComponent";
import { describe, it, expect } from "vitest";

describe(SampleComponent.name, () => {
  it("renders hello world", () => {
    render(<SampleComponent />);

    expect(screen.getByText("Hello World"));
    expect(screen.queryByText("Hello World2")).toBeNull();
  });
});
