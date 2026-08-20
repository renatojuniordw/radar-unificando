// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OutdatedProfileBanner } from "@/components/profile/outdated-profile-banner";

describe("OutdatedProfileBanner", () => {
  it("should_render_null_when_age_days_is_less_than_60", () => {
    const { container } = render(<OutdatedProfileBanner ageDays={45} />);
    expect(container.firstChild).toBeNull();
  });

  it("should_render_banner_when_age_days_is_60_or_more", () => {
    render(<OutdatedProfileBanner ageDays={75} />);

    expect(screen.getByText("Currículo base atualizado há 75 dias")).toBeTruthy();
    expect(
      screen.getByText(
        "Mantenha seu perfil em dia para que as análises ATS e currículos adaptados reflitam suas conquistas e cargos mais recentes.",
      ),
    ).toBeTruthy();
  });

  it("should_trigger_onStartImport_when_button_clicked", () => {
    const onStartImport = vi.fn();
    render(<OutdatedProfileBanner ageDays={90} onStartImport={onStartImport} />);

    const button = screen.getByRole("button", { name: /atualizar agora/i });
    fireEvent.click(button);

    expect(onStartImport).toHaveBeenCalledTimes(1);
  });
});
