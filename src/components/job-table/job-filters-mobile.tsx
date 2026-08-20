import { Box, TextField, Button, InputAdornment, Chip } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { tokens } from "@/lib/infrastructure/ui/tokens";

interface Props {
  searchFilter: string;
  onSearchChange: (value: string) => void;
  platformFilter: string;
  onPlatformChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  countSecondaryFilters: number;
  countTotalFilters: number;
  onOpenDrawer: () => void;
  onClearFilters: () => void;
}

const PLATFORMS = [
  { label: "TODAS", value: "" },
  { label: "GUPY", value: "Gupy" },
  { label: "INHIRE", value: "InHire" },
];

const QUICK_TYPES = [
  { label: "TODAS", value: "" },
  { label: "REMOTO", value: "Remota" },
  { label: "HÍBRIDO", value: "Híbrida" },
  { label: "PRESENCIAL", value: "Presencial" },
];

export function JobFiltersMobile({
  searchFilter,
  onSearchChange,
  platformFilter,
  onPlatformChange,
  typeFilter,
  onTypeChange,
  onSubmit,
  countSecondaryFilters,
  countTotalFilters,
  onOpenDrawer,
  onClearFilters,
}: Props) {
  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{ display: { xs: "block", md: "none" }, mb: 2.5 }}
    >
      {/* Full-width Search Bar */}
      <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
        <TextField
          size="small"
          value={searchFilter}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Refinar nesta lista..."
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: tokens.primary }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            flex: 1,
            bgcolor: tokens.surface,
            "& .MuiOutlinedInput-root": {
              borderRadius: 0,
              border: tokens.border,
              fontWeight: 700,
              fontSize: "0.85rem",
              fontFamily: tokens.fontMono,
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          size="small"
          sx={{
            borderRadius: 0,
            border: tokens.border,
            bgcolor: tokens.primary,
            color: tokens.accent,
            boxShadow: "2px 2px 0px #000",
            fontWeight: 900,
            fontFamily: tokens.fontMono,
            px: 2.5,
            fontSize: "0.85rem",
            "&:hover": {
              bgcolor: "#1e293b",
              color: tokens.accent,
            },
          }}
        >
          IR
        </Button>
      </Box>

      {/* Mobile Horizontal Quick Filters Carousel */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          overflowX: "auto",
          pb: 1.5,
          mb: 1.5,
          "::-webkit-scrollbar": { display: "none" },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {PLATFORMS.filter((p) => p.value !== "").map((p) => {
          const isSelected = platformFilter === p.value;
          return (
            <Chip
              key={p.label}
              label={p.label}
              onClick={() => onPlatformChange(isSelected ? "" : p.value)}
              size="small"
              clickable
              sx={{
                bgcolor: isSelected ? tokens.accent : tokens.surface,
                color: isSelected ? tokens.primary : "#475569",
                border: tokens.border,
                fontWeight: 900,
                fontSize: "0.68rem",
                fontFamily: tokens.fontMono,
                borderRadius: 0,
                boxShadow: isSelected ? "2px 2px 0px #000" : "none",
                flexShrink: 0,
              }}
            />
          );
        })}

        <Chip
          label={`MODALIDADE: ${typeFilter ? typeFilter.toUpperCase() : "TODAS"}`}
          onClick={onOpenDrawer}
          size="small"
          clickable
          sx={{
            bgcolor: typeFilter ? tokens.primary : "#f1f5f9",
            color: typeFilter ? tokens.accent : tokens.primary,
            border: tokens.border,
            fontWeight: 900,
            fontSize: "0.68rem",
            fontFamily: tokens.fontMono,
            borderRadius: 0,
            boxShadow: "2px 2px 0px #000",
            flexShrink: 0,
          }}
        />

        {QUICK_TYPES.filter((t) => t.value !== "").map((t) => {
          const isSelected = typeFilter === t.value;
          return (
            <Chip
              key={t.label}
              label={t.label}
              onClick={() => onTypeChange(isSelected ? "" : t.value)}
              size="small"
              clickable
              sx={{
                bgcolor: isSelected ? tokens.accent : tokens.surface,
                color: isSelected ? tokens.primary : "#475569",
                border: tokens.border,
                fontWeight: 900,
                fontSize: "0.68rem",
                fontFamily: tokens.fontMono,
                borderRadius: 0,
                boxShadow: isSelected ? "2px 2px 0px #000" : "none",
                flexShrink: 0,
              }}
            />
          );
        })}
      </Box>

      {/* Filter Trigger Pills */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Button
          onClick={onOpenDrawer}
          fullWidth
          size="small"
          startIcon={<FilterListIcon fontSize="small" />}
          sx={{
            justifyContent: "center",
            border: tokens.border,
            bgcolor: countSecondaryFilters > 0 ? tokens.primary : tokens.surface,
            color: countSecondaryFilters > 0 ? tokens.accent : tokens.primary,
            fontWeight: 900,
            fontSize: "0.75rem",
            fontFamily: tokens.fontMono,
            borderRadius: 0,
            py: 1,
            px: 2,
            boxShadow: "2px 2px 0px #000",
            "&:hover": {
              bgcolor: countSecondaryFilters > 0 ? "#1e293b" : "#f1f5f9",
            },
          }}
        >
          FILTROS AVANÇADOS{" "}
          {countSecondaryFilters > 0 ? `(${countSecondaryFilters})` : ""}
        </Button>

        {countTotalFilters > 0 && (
          <Button
            onClick={onClearFilters}
            size="small"
            startIcon={<DeleteOutlineIcon fontSize="small" />}
            sx={{
              minWidth: "auto",
              px: 1.5,
              py: 1,
              border: tokens.border,
              bgcolor: tokens.surface,
              color: "#ef4444",
              fontWeight: 900,
              fontSize: "0.7rem",
              fontFamily: tokens.fontMono,
              borderRadius: 0,
              boxShadow: "2px 2px 0px #000",
              whiteSpace: "nowrap",
            }}
          >
            LIMPAR
          </Button>
        )}
      </Box>
    </Box>
  );
}
