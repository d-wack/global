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

  it("marks neither button active without a userVote", () => {
    render(<VoteControls votes={0} onVote={() => {}} />);
    expect(screen.getByLabelText("Vote up")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByLabelText("Vote down")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("highlights the up button when the user voted up", () => {
    render(<VoteControls votes={1} onVote={() => {}} userVote="up" />);
    expect(screen.getByLabelText("Vote up")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("Vote down")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("highlights the down button when the user voted down", () => {
    render(<VoteControls votes={-1} onVote={() => {}} userVote="down" />);
    expect(screen.getByLabelText("Vote down")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("Vote up")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
