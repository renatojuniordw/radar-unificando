"use client";

import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  Autocomplete,
  Drawer,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { tokens } from "@/lib/infrastructure/ui/tokens";

interface Props {
  open: boolean;
  onClose: () => void;
  platformFilter: string;
  onPlatformChange: (value: string) => void;
  companies: string[];
  companyFilter: string;
  onCompanyChange: (value: string) => void;
  types: string[];
  typeFilter: string;
  onTypeChange: (value: string) => void;
  roles: string[];
  roleFilter: string;
  onRoleChange: (value: string) => void;
  filteredTotal: number;
  countSecondaryFilters: number;
  onClearFilters: () => void;
}

export function JobFiltersDrawer({
  open,
  onClose,
  platformFilter,
  onPlatformChange,
  companies,
  companyFilter,
  onCompanyChange,
  types,
  typeFilter,
  onTypeChange,
  roles,
  roleFilter,
  onRoleChange,
  filteredTotal,
  countSecondaryFilters,
  onClearFilters,
}: Props) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTop: "4px solid #020617",
          bgcolor: tokens.surface,
          p: 2.5,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          maxHeight: "85vh",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          pb: 1,
          borderBottom: tokens.border,
        }}
      >
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: "1.1rem",
            color: tokens.primary,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
          }}
        >
          ⚡ FILTROS AVANÇADOS
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Fechar filtros"
          sx={{
            border: tokens.border,
            borderRadius: 0,
            p: 0.5,
            color: tokens.primary,
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "0.7rem",
              color: "#475569",
              textTransform: "uppercase",
              mb: 0.75,
              fontFamily: tokens.fontMono,
            }}
          >
            Plataforma
          </Typography>
          <Select
            fullWidth
            value={platformFilter}
            onChange={(e) => onPlatformChange(e.target.value)}
            displayEmpty
            size="small"
            sx={{
              backgroundColor: tokens.surface,
              borderRadius: 0,
              border: tokens.border,
              fontSize: "0.85rem",
              fontWeight: 700,
              fontFamily: tokens.fontMono,
            }}
          >
            <MenuItem value="">TODAS AS PLATAFORMAS</MenuItem>
            <MenuItem value="Gupy">GUPY</MenuItem>
            <MenuItem value="InHire">INHIRE</MenuItem>
          </Select>
        </Box>

        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "0.7rem",
              color: "#475569",
              textTransform: "uppercase",
              mb: 0.75,
              fontFamily: tokens.fontMono,
            }}
          >
            Empresa
          </Typography>
          <Autocomplete
            options={companies}
            value={companyFilter || null}
            onChange={(_, v) => onCompanyChange(v || "")}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="SELECIONE UMA EMPRESA"
                size="small"
              />
            )}
            size="small"
            noOptionsText="Nenhuma empresa encontrada"
            disableClearable={false}
          />
        </Box>

        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "0.7rem",
              color: "#475569",
              textTransform: "uppercase",
              mb: 0.75,
              fontFamily: tokens.fontMono,
            }}
          >
            Modalidade
          </Typography>
          <Autocomplete
            options={types}
            value={typeFilter || null}
            onChange={(_, v) => onTypeChange(v || "")}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="SELECIONE A MODALIDADE"
                size="small"
              />
            )}
            size="small"
            noOptionsText="Nenhuma opção"
            disableClearable={false}
          />
        </Box>

        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "0.7rem",
              color: "#475569",
              textTransform: "uppercase",
              mb: 0.75,
              fontFamily: tokens.fontMono,
            }}
          >
            Cargo
          </Typography>
          <Autocomplete
            options={roles}
            value={roleFilter || null}
            onChange={(_, v) => onRoleChange(v || "")}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="SELECIONE O CARGO"
                size="small"
              />
            )}
            size="small"
            noOptionsText="Nenhum cargo encontrado"
            disableClearable={false}
          />
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Button
          onClick={onClose}
          fullWidth
          variant="contained"
          sx={{
            borderRadius: 0,
            border: tokens.border,
            bgcolor: tokens.primary,
            color: tokens.accent,
            boxShadow: tokens.shadow,
            fontWeight: 900,
            fontFamily: tokens.fontMono,
            py: 1.25,
            fontSize: "0.85rem",
            "&:hover": {
              bgcolor: "#1e293b",
            },
          }}
        >
          VER {filteredTotal} VAGAS →
        </Button>

        {countSecondaryFilters > 0 && (
          <Button
            onClick={() => {
              onClearFilters();
              onClose();
            }}
            sx={{
              borderRadius: 0,
              border: tokens.border,
              bgcolor: tokens.surface,
              color: "#ef4444",
              boxShadow: tokens.shadow,
              fontWeight: 900,
              fontFamily: tokens.fontMono,
              px: 2,
              fontSize: "0.75rem",
              whiteSpace: "nowrap",
            }}
          >
            LIMPAR
          </Button>
        )}
      </Box>
    </Drawer>
  );
}
