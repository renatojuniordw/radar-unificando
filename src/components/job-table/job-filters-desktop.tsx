'use client';

import { Box, TextField, Button, Chip, InputAdornment, Badge } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

interface Props {
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
  searchFilter: string;
  onSearchChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  countSecondaryFilters: number;
  countTotalFilters: number;
  onOpenDrawer: () => void;
  onClearFilters: () => void;
}

const PLATFORMS = [
  { label: 'TODAS', value: '' },
  { label: 'GUPY', value: 'Gupy' },
  { label: 'INHIRE', value: 'InHire' },
];

const QUICK_TYPES = [
  { label: 'TODAS', value: '' },
  { label: 'REMOTO', value: 'Remoto' },
  { label: 'HÍBRIDO', value: 'Híbrido' },
  { label: 'PRESENCIAL', value: 'Presencial' },
];

export function JobFiltersDesktop({
  platformFilter,
  onPlatformChange,
  companyFilter,
  onCompanyChange,
  typeFilter,
  onTypeChange,
  roleFilter,
  onRoleChange,
  searchFilter,
  onSearchChange,
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
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        gap: 1.5,
        mb: 2.5,
      }}
    >
      {/* Search Bar + Advanced Filters Button Row */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <TextField
          size="small"
          value={searchFilter}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Refinar resultados nesta lista por palavra-chave..."
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#020617' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            flex: 1,
            bgcolor: '#ffffff',
            '& .MuiOutlinedInput-root': {
              borderRadius: 0,
              border: '2px solid #020617',
              fontFamily: 'ui-monospace, monospace',
              fontWeight: 700,
              fontSize: '0.85rem',
            },
          }}
        />

        <Button
          type="submit"
          variant="contained"
          size="small"
          sx={{
            borderRadius: 0,
            border: '2px solid #020617',
            bgcolor: '#020617',
            color: '#ccff00',
            boxShadow: '3px 3px 0px #000',
            fontWeight: 900,
            fontFamily: 'ui-monospace, monospace',
            height: 40,
            px: 2.5,
            '&:hover': {
              bgcolor: '#1e293b',
              color: '#ccff00',
            },
          }}
        >
          BUSCAR
        </Button>

        <Badge badgeContent={countSecondaryFilters} color="warning" overlap="circular">
          <Button
            onClick={onOpenDrawer}
            variant="outlined"
            size="small"
            startIcon={<FilterListIcon fontSize="small" />}
            sx={{
              borderRadius: 0,
              border: '2px solid #020617',
              bgcolor: countSecondaryFilters > 0 ? '#1e293b' : '#ffffff',
              color: countSecondaryFilters > 0 ? '#ccff00' : '#020617',
              boxShadow: '3px 3px 0px #000',
              fontWeight: 900,
              fontFamily: 'ui-monospace, monospace',
              height: 40,
              px: 2,
              whiteSpace: 'nowrap',
              '&:hover': {
                bgcolor: '#020617',
                color: '#ccff00',
              },
            }}
          >
            FILTROS AVANÇADOS
          </Button>
        </Badge>
      </Box>

      {/* Quick Filter Segmented Control Groups Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2.5,
          flexWrap: 'wrap',
          bgcolor: '#f8fafc',
          p: 1.75,
          border: '2px solid #020617',
          boxShadow: '3px 3px 0px #020617',
        }}
      >
        {/* Platform Segmented Filter Group */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              bgcolor: '#020617',
              color: '#f8fafc',
              px: 1,
              py: 0.5,
              fontSize: '0.68rem',
              fontWeight: 900,
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Plataforma
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {PLATFORMS.map((p) => {
              const isSelected = platformFilter === p.value;
              return (
                <Chip
                  key={p.label}
                  label={p.label}
                  onClick={() => onPlatformChange(p.value)}
                  size="small"
                  clickable
                  sx={{
                    bgcolor: isSelected ? '#ccff00' : '#ffffff',
                    border: '2px solid #020617',
                    fontWeight: 900,
                    fontSize: '0.7rem',
                    fontFamily: 'ui-monospace, monospace',
                    borderRadius: 0,
                    boxShadow: isSelected ? '2px 2px 0px #020617' : 'none',
                    transition: 'all 0.15s ease',
                    '& .MuiChip-label': {
                      color: isSelected ? '#020617' : '#334155',
                      px: 1.25,
                    },
                    '&:hover': {
                      bgcolor: isSelected ? '#b3e600' : '#020617',
                      '& .MuiChip-label': {
                        color: isSelected ? '#020617' : '#ffffff',
                      },
                    },
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {/* Modality Segmented Filter Group */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              bgcolor: '#020617',
              color: '#f8fafc',
              px: 1,
              py: 0.5,
              fontSize: '0.68rem',
              fontWeight: 900,
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Modalidade
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {QUICK_TYPES.map((t) => {
              const isSelected = typeFilter === t.value;
              return (
                <Chip
                  key={t.label}
                  label={t.label}
                  onClick={() => onTypeChange(t.value)}
                  size="small"
                  clickable
                  sx={{
                    bgcolor: isSelected ? '#ccff00' : '#ffffff',
                    border: '2px solid #020617',
                    fontWeight: 900,
                    fontSize: '0.7rem',
                    fontFamily: 'ui-monospace, monospace',
                    borderRadius: 0,
                    boxShadow: isSelected ? '2px 2px 0px #020617' : 'none',
                    transition: 'all 0.15s ease',
                    '& .MuiChip-label': {
                      color: isSelected ? '#020617' : '#334155',
                      px: 1.25,
                    },
                    '&:hover': {
                      bgcolor: isSelected ? '#b3e600' : '#020617',
                      '& .MuiChip-label': {
                        color: isSelected ? '#020617' : '#ffffff',
                      },
                    },
                  }}
                />
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Active Applied Filters Tag Bar */}
      {countTotalFilters > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', pt: 0.5 }}>
          <Box
            component="span"
            sx={{
              fontSize: '0.68rem',
              fontWeight: 800,
              fontFamily: 'ui-monospace, monospace',
              color: '#020617',
              textTransform: 'uppercase',
            }}
          >
            Filtros Ativos:
          </Box>

          {platformFilter && (
            <Chip
              label={`Plataforma: ${platformFilter}`}
              onDelete={() => onPlatformChange('')}
              size="small"
              color="warning"
              sx={{ fontWeight: 800, fontSize: '0.7rem', borderRadius: 0 }}
            />
          )}

          {companyFilter && (
            <Chip
              label={`Empresa: ${companyFilter}`}
              onDelete={() => onCompanyChange('')}
              size="small"
              color="warning"
              sx={{ fontWeight: 800, fontSize: '0.7rem', borderRadius: 0 }}
            />
          )}

          {typeFilter && (
            <Chip
              label={`Modalidade: ${typeFilter}`}
              onDelete={() => onTypeChange('')}
              size="small"
              color="warning"
              sx={{ fontWeight: 800, fontSize: '0.7rem', borderRadius: 0 }}
            />
          )}

          {roleFilter && (
            <Chip
              label={`Cargo: ${roleFilter}`}
              onDelete={() => onRoleChange('')}
              size="small"
              color="warning"
              sx={{ fontWeight: 800, fontSize: '0.7rem', borderRadius: 0 }}
            />
          )}

          <Button
            onClick={onClearFilters}
            size="small"
            sx={{
              fontSize: '0.68rem',
              fontWeight: 800,
              fontFamily: 'ui-monospace, monospace',
              color: '#ef4444',
              textDecoration: 'underline',
              p: 0,
              minWidth: 'auto',
              '&:hover': { background: 'transparent', color: '#b91c1c' },
            }}
          >
            Limpar todos
          </Button>
        </Box>
      )}
    </Box>
  );
}

