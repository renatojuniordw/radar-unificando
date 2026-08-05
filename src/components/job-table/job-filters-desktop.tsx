'use client';

import { Box, TextField, Button, Select, MenuItem, InputAdornment, Autocomplete } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

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
}

export function JobFiltersDesktop({
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
  searchFilter,
  onSearchChange,
  onSubmit,
}: Props) {
  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        display: { xs: 'none', md: 'grid' },
        gridTemplateColumns: '130px 180px 160px 180px 1fr',
        gap: 1.5,
        alignItems: 'center',
        mb: 2.5,
      }}
    >
      <Select
        value={platformFilter}
        onChange={e => onPlatformChange(e.target.value)}
        displayEmpty
        size="small"
        sx={{
          backgroundColor: '#ffffff',
          borderRadius: 0,
          border: '2px solid #020617',
          fontSize: '0.75rem',
          fontWeight: 700,
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        <MenuItem value="">TODAS PLATS</MenuItem>
        <MenuItem value="Gupy">GUPY</MenuItem>
        <MenuItem value="InHire">INHIRE</MenuItem>
      </Select>

      <Autocomplete
        options={companies}
        value={companyFilter || null}
        onChange={(_, v) => onCompanyChange(v || '')}
        renderInput={(params) => (
          <TextField {...params} placeholder="TODAS EMPRESAS" size="small" />
        )}
        size="small"
        noOptionsText="Nenhuma"
        disableClearable={false}
      />

      <Autocomplete
        options={types}
        value={typeFilter || null}
        onChange={(_, v) => onTypeChange(v || '')}
        renderInput={(params) => (
          <TextField {...params} placeholder="MODALIDADES" size="small" />
        )}
        size="small"
        noOptionsText="Nenhuma"
        disableClearable={false}
      />

      <Autocomplete
        options={roles}
        value={roleFilter || null}
        onChange={(_, v) => onRoleChange(v || '')}
        renderInput={(params) => (
          <TextField {...params} placeholder="TODOS CARGOS" size="small" />
        )}
        size="small"
        noOptionsText="Nenhuma"
        disableClearable={false}
      />

      <Box sx={{ display: 'flex', gap: 0, width: '100%' }}>
        <TextField
          size="small"
          value={searchFilter}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Buscar por palavra-chave..."
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          sx={{ flex: 1 }}
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
            boxShadow: '2px 2px 0px #000',
            fontWeight: 900,
            fontFamily: 'ui-monospace, monospace',
            px: 2.5,
            '&:hover': {
              bgcolor: '#1e293b',
              color: '#ccff00',
            },
          }}
        >
          IR
        </Button>
      </Box>
    </Box>
  );
}
