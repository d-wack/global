import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VoteControls } from "@/components/panel/vote-controls";

describe("VoteControls", () => {
  it("shows the net vote count", () => {
    render(<VoteControls votes={7} onVote={() => {}} />);
    expect(screen.getByLabelText("Net votes")).toHaveTextContent("7");
  });

  it("calls onVote with the direction clicked", () => {
    const onVote = vi.fn();
    render(<VoteControls votes={0} onVote={onVote} />);

    fireEvent.click(screen.getByLabelText("Vote up"));
    fireEvent.click(screen.getByLabelText("Vote down"));

    expect(onVote.mock.calls).toEqual([["up"], ["down"]]);
  });

  it("disables the buttons when disabled", () => {
    render(<VoteControls votes={0} onVote={() => {}} disabled />);
    expect(screen.getByLabelText("Vote up")).toBeDisabled();
    expect(screen.getByLabelText("Vote down")).toBeDisabled();
  });
});
