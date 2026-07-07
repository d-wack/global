import { useUser } from "@auth0/nextjs-auth0";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountChip } from "@/components/widget/account-chip";

vi.mock("@auth0/nextjs-auth0", () => ({ useUser: vi.fn() }));

const mockUseUser = vi.mocked(useUser);
type UserResult = ReturnType<typeof useUser>;

describe("AccountChip", () => {
  beforeEach(() => {
    mockUseUser.mockReset();
  });

  it("renders nothing in open mode / when logged out", () => {
    // Auth0 unconfigured (open mode): no session, no user.
    mockUseUser.mockReturnValue({
      user: undefined,
      isLoading: false,
    } as UserResult);
    const { container } = render(<AccountChip />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the user's name and a logout link when signed in", () => {
    mockUseUser.mockReturnValue({
      user: { name: "Ada Lovelace", email: "ada@example.com" },
      isLoading: false,
    } as UserResult);
    render(<AccountChip />);

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    // Initial avatar.
    expect(screen.getByText("A")).toBeInTheDocument();
    const logout = screen.getByRole("link", { name: "LOGOUT" });
    expect(logout).toHaveAttribute("href", "/auth/logout");
  });

  it("falls back to the email when no name is present", () => {
    mockUseUser.mockReturnValue({
      user: { email: "grace@example.com" },
      isLoading: false,
    } as UserResult);
    render(<AccountChip />);
    expect(screen.getByText("grace@example.com")).toBeInTheDocument();
  });
});
