// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResumeProgressToast, type ResumeProgressState } from "@/components/resume/resume-progress-toast";

describe("ResumeProgressToast", () => {
  it("should_render_null_when_state_is_null", () => {
    const { container } = render(<ResumeProgressToast state={null} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("should_render_generating_state_with_progress_and_step", () => {
    const state: ResumeProgressState = {
      jobTitle: "Engenheiro de Software",
      jobCompany: "Google",
      step: 2,
      totalSteps: 3,
      message: "Adaptando experiências com IA...",
      progressPercent: 55,
      status: "generating",
    };

    render(<ResumeProgressToast state={state} onClose={vi.fn()} />);

    expect(screen.getByText("CONFECCIONANDO CURRÍCULO (2/3)")).toBeTruthy();
    expect(screen.getByText("Engenheiro de Software — Google")).toBeTruthy();
    expect(screen.getByText("Adaptando experiências com IA...")).toBeTruthy();
  });

  it("should_render_success_state", () => {
    const state: ResumeProgressState = {
      jobTitle: "Desenvolvedor Frontend",
      jobCompany: "Meta",
      step: 3,
      totalSteps: 3,
      message: "Download iniciado.",
      progressPercent: 100,
      status: "success",
    };

    render(<ResumeProgressToast state={state} onClose={vi.fn()} />);

    expect(screen.getByText("CURRÍCULO CONFECCIONADO!")).toBeTruthy();
    expect(screen.getByText("Desenvolvedor Frontend — Meta")).toBeTruthy();
    expect(screen.getByText("O download do PDF foi iniciado e salvo no seu computador!")).toBeTruthy();
  });

  it("should_render_error_state", () => {
    const state: ResumeProgressState = {
      jobTitle: "Dev Ops",
      jobCompany: "AWS",
      step: 0,
      totalSteps: 3,
      message: "Falha na conexão",
      progressPercent: 0,
      status: "error",
      errorMessage: "Erro no servidor ao gerar PDF",
    };

    render(<ResumeProgressToast state={state} onClose={vi.fn()} />);

    expect(screen.getByText("ERRO NA GERAÇÃO")).toBeTruthy();
    expect(screen.getByText("Erro no servidor ao gerar PDF")).toBeTruthy();
  });

  it("should_call_onClose_when_close_button_clicked", () => {
    const onClose = vi.fn();
    const state: ResumeProgressState = {
      jobTitle: "Dev",
      jobCompany: "ACME",
      step: 1,
      totalSteps: 3,
      message: "Processando...",
      progressPercent: 20,
      status: "generating",
    };

    render(<ResumeProgressToast state={state} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Fechar notificação"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
