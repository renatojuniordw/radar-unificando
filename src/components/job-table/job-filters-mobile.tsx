import { Box, TextField, Button, InputAdornment, Chip } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

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
                  <SearchIcon fontSize="small" sx={{ color: "#020617" }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            flex: 1,
            bgcolor: "#ffffff",
            "& .MuiOutlinedInput-root": {
              borderRadius: 0,
              border: "2px solid #020617",
              fontWeight: 700,
              fontSize: "0.85rem",
              fontFamily: "ui-monospace, monospace",
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          size="small"
          sx={{
            borderRadius: 0,
            border: "2px solid #020617",
            bgcolor: "#020617",
            color: "#ccff00",
            boxShadow: "2px 2px 0px #000",
            fontWeight: 900,
            fontFamily: "ui-monospace, monospace",
            px: 2.5,
            fontSize: "0.85rem",
            "&:hover": {
              bgcolor: "#1e293b",
              color: "#ccff00",
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
                bgcolor: isSelected ? "#ccff00" : "#ffffff",
                color: isSelected ? "#020617" : "#475569",
                border: "2px solid #020617",
                fontWeight: 900,
                fontSize: "0.68rem",
                fontFamily: "ui-monospace, monospace",
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
            bgcolor: typeFilter ? "#020617" : "#f1f5f9",
            color: typeFilter ? "#ccff00" : "#020617",
            border: "2px solid #020617",
            fontWeight: 900,
            fontSize: "0.68rem",
            fontFamily: "ui-monospace, monospace",
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
                bgcolor: isSelected ? "#ccff00" : "#ffffff",
                color: isSelected ? "#020617" : "#475569",
                border: "2px solid #020617",
                fontWeight: 900,
                fontSize: "0.68rem",
                fontFamily: "ui-monospace, monospace",
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
            border: "2px solid #020617",
            bgcolor: countSecondaryFilters > 0 ? "#020617" : "#ffffff",
            color: countSecondaryFilters > 0 ? "#ccff00" : "#020617",
            fontWeight: 900,
            fontSize: "0.75rem",
            fontFamily: "ui-monospace, monospace",
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
              border: "2px solid #020617",
              bgcolor: "#ffffff",
              color: "#ef4444",
              fontWeight: 900,
              fontSize: "0.7rem",
              fontFamily: "ui-monospace, monospace",
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
