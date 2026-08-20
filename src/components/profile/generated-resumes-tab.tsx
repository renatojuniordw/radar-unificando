"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Pagination,
} from "@mui/material";
import {
  Download,
  ContentCopy,
  Visibility,
  Description,
  CalendarToday,
  Business,
  LocationOn,
} from "@mui/icons-material";
import { downloadAdaptedResume, downloadAdaptedResumeDocx } from "@/lib/client/resume-download";

export interface GeneratedResumeItem {
  id: string;
  jobTitle: string;
  jobCompany: string;
  jobLocation: string;
  createdAt: string;
  expiresAt: string;
  resumeMarkdown: string;
}

const PAGE_SIZE = 10;

export function GeneratedResumesTab() {
  const [items, setItems] = useState<GeneratedResumeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<GeneratedResumeItem | null>(null);
  const [snackbar, setSnackbar] = useState("");

  function loadHistory(targetPage: number) {
    setLoading(true);
    fetch(`/api/resume/history?page=${targetPage}&pageSize=${PAGE_SIZE}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erro ao carregar histórico");
        }
        return res.json();
      })
      .then((data) => {
        setItems(data.history || []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setError("");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erro de conexão.");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const handleRetry = () => {
    loadHistory(page);
  };

  useEffect(() => {
    loadHistory(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleDownload = async (item: GeneratedResumeItem) => {
    if (downloadingId) return;
    setDownloadingId(item.id);
    try {
      await downloadAdaptedResume({
        title: item.jobTitle,
        company: item.jobCompany,
        location: item.jobLocation,
      });
      setSnackbar("PDF baixado com sucesso!");
    } catch (e) {
      setSnackbar(e instanceof Error ? e.message : "Erro ao baixar PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadDocx = async (item: GeneratedResumeItem) => {
    if (downloadingId) return;
    setDownloadingId(`${item.id}-docx`);
    try {
      await downloadAdaptedResumeDocx({
        title: item.jobTitle,
        company: item.jobCompany,
        location: item.jobLocation,
      });
      setSnackbar("Arquivo Word (DOCX) baixado com sucesso!");
    } catch (e) {
      setSnackbar(e instanceof Error ? e.message : "Erro ao baixar DOCX.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopyText = (markdown: string) => {
    navigator.clipboard.writeText(markdown);
    setSnackbar("Texto do currículo copiado para a área de transferência!");
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 8 }}>
        <CircularProgress sx={{ color: "#ccff00" }} />
        <Typography sx={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8rem", color: "#64748b" }}>
          CARREGANDO CURRÍCULOS GERADOS...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, border: "2px solid #ef4444", bgcolor: "#fef2f2", color: "#991b1b", mb: 4 }}>
        <Typography sx={{ fontFamily: "ui-monospace, monospace", fontSize: "0.85rem", fontWeight: 700 }}>
          {error}
        </Typography>
        <Button
          onClick={handleRetry}
          sx={{ mt: 1, bgcolor: "#991b1b", color: "#fff", "&:hover": { bgcolor: "#7f1d1d" } }}
          size="small"
        >
          Tentar Novamente
        </Button>
      </Box>
    );
  }

  if (items.length === 0 && total === 0) {
    return (
      <Box
        className="card-brutalist"
        sx={{
          p: 5,
          textAlign: "center",
          bgcolor: "#ffffff",
          border: "3px solid #020617",
          boxShadow: "6px 6px 0px #000",
          mb: 4,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "3px solid #020617",
            bgcolor: "#ccff00",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
            boxShadow: "3px 3px 0px #000",
          }}
        >
          <Description sx={{ fontSize: 28, color: "#020617" }} />
        </Box>
        <Typography sx={{ fontWeight: 900, fontSize: "1.1rem", textTransform: "uppercase", mb: 1 }}>
          Nenhum currículo confeccionado ainda
        </Typography>
        <Typography sx={{ color: "#64748b", fontFamily: "ui-monospace, monospace", fontSize: "0.8rem", maxW: 420, mx: "auto", mb: 3 }}>
          Quando você clica em &quot;GERAR CURRÍCULO&quot; nas vagas ou na Análise ATS, seus currículos adaptados por IA ficam salvos aqui para download rápido a qualquer momento.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mb: 4 }}>
      <Typography sx={{ fontWeight: 900, fontSize: "0.85rem", textTransform: "uppercase", color: "#64748b", fontFamily: "ui-monospace, monospace", letterSpacing: "0.05em" }}>
        {total} CURRÍCULO{total === 1 ? "" : "S"} ADAPTADO{total === 1 ? "" : "S"} DISPONÍVE{total === 1 ? "L" : "IS"}
      </Typography>

      {items.map((item) => {
        const formattedDate = new Date(item.createdAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <Box
            key={item.id}
            className="card-brutalist"
            sx={{
              p: { xs: 2, sm: 3 },
              bgcolor: "#ffffff",
              border: "3px solid #020617",
              boxShadow: "5px 5px 0px #000",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {/* Header: Vaga e Empresa */}
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 900, fontSize: "1.05rem", color: "#020617", lineHeight: 1.25 }}>
                  {item.jobTitle}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mt: 0.5 }}>
                  {item.jobCompany && (
                    <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: "#334155", display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                      <Business sx={{ fontSize: 16, color: "#64748b" }} />
                      {item.jobCompany}
                    </Typography>
                  )}
                  {item.jobLocation && (
                    <Typography sx={{ fontSize: "0.75rem", color: "#64748b", display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                      <LocationOn sx={{ fontSize: 16, color: "#64748b" }} />
                      {item.jobLocation}
                    </Typography>
                  )}
                  <Typography sx={{ fontFamily: "ui-monospace, monospace", fontSize: "0.7rem", color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                    <CalendarToday sx={{ fontSize: 14 }} />
                    Gerado em {formattedDate}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Ações */}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", pt: 1, borderTop: "1px solid #e2e8f0" }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleDownload(item)}
                disabled={downloadingId === item.id || downloadingId === `${item.id}-docx`}
                startIcon={downloadingId === item.id ? <CircularProgress size={14} color="inherit" /> : <Download sx={{ fontSize: 16 }} />}
                sx={{
                  bgcolor: "#ccff00",
                  color: "#020617",
                  fontWeight: 900,
                  fontSize: "0.7rem",
                  fontFamily: "ui-monospace, monospace",
                  border: "2px solid #020617",
                  boxShadow: "2px 2px 0px #000",
                  textTransform: "uppercase",
                  "&:hover": { bgcolor: "#b8e600" },
                }}
              >
                {downloadingId === item.id ? "BAIXANDO..." : "BAIXAR PDF"}
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => handleDownloadDocx(item)}
                disabled={downloadingId === item.id || downloadingId === `${item.id}-docx`}
                startIcon={downloadingId === `${item.id}-docx` ? <CircularProgress size={14} color="inherit" /> : <Download sx={{ fontSize: 16 }} />}
                sx={{
                  bgcolor: "#ffffff",
                  color: "#020617",
                  fontWeight: 900,
                  fontSize: "0.7rem",
                  fontFamily: "ui-monospace, monospace",
                  border: "2px solid #020617",
                  boxShadow: "2px 2px 0px #000",
                  textTransform: "uppercase",
                  "&:hover": { bgcolor: "#f8fafc" },
                }}
              >
                {downloadingId === `${item.id}-docx` ? "BAIXANDO..." : "DOCX (WORD)"}
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => handleCopyText(item.resumeMarkdown)}
                startIcon={<ContentCopy sx={{ fontSize: 16 }} />}
                sx={{
                  bgcolor: "#ffffff",
                  color: "#020617",
                  fontWeight: 900,
                  fontSize: "0.7rem",
                  fontFamily: "ui-monospace, monospace",
                  border: "2px solid #020617",
                  boxShadow: "2px 2px 0px #000",
                  textTransform: "uppercase",
                  "&:hover": { bgcolor: "#f8fafc" },
                }}
              >
                COPIAR TEXTO
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => setPreviewItem(item)}
                startIcon={<Visibility sx={{ fontSize: 16 }} />}
                sx={{
                  bgcolor: "#ffffff",
                  color: "#020617",
                  fontWeight: 900,
                  fontSize: "0.7rem",
                  fontFamily: "ui-monospace, monospace",
                  border: "2px solid #020617",
                  boxShadow: "2px 2px 0px #000",
                  textTransform: "uppercase",
                  "&:hover": { bgcolor: "#f8fafc" },
                }}
              >
                VER RESUMO
              </Button>
            </Box>
          </Box>
        );
      })}

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            shape="rounded"
            sx={{
              "& .MuiPaginationItem-root": {
                fontFamily: "ui-monospace, monospace",
                fontWeight: 700,
                color: "#020617",
                border: "2px solid #020617",
              },
              "& .Mui-selected": {
                bgcolor: "#ccff00 !important",
              },
            }}
          />
        </Box>
      )}

      {/* Dialog Preview */}
      {previewItem && (
        <Dialog
          open
          onClose={() => setPreviewItem(null)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: "#020617",
              color: "#f8fafc",
              border: "3px solid #ccff00",
              boxShadow: "8px 8px 0px #000",
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 900, color: "#ccff00", fontFamily: "ui-monospace, monospace", fontSize: "1rem" }}>
            CURRÍCULO ADAPTADO: {previewItem.jobTitle} {previewItem.jobCompany ? `— ${previewItem.jobCompany}` : ""}
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: "#1e293b" }}>
            <Box
              component="pre"
              sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.8rem",
                color: "#e2e8f0",
                m: 0,
              }}
            >
              {previewItem.resumeMarkdown}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: "#0f172a" }}>
            <Button
              onClick={() => handleCopyText(previewItem.resumeMarkdown)}
              startIcon={<ContentCopy sx={{ fontSize: 16 }} />}
              sx={{ bgcolor: "#ccff00", color: "#020617", fontWeight: 900, fontFamily: "ui-monospace, monospace" }}
            >
              COPIAR TEXTO
            </Button>
            <Button onClick={() => setPreviewItem(null)} sx={{ color: "#94a3b8" }}>
              Fechar
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSnackbar("")}>
          {snackbar}
        </Alert>
      </Snackbar>
    </Box>
  );
}
