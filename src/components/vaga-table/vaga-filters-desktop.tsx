'use client';

import { Box, TextField, Button, Select, MenuItem, InputAdornment, Autocomplete } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface Props {
  filtroPlataforma: string;
  onPlataformaChange: (value: string) => void;
  empresas: string[];
  filtroEmpresa: string;
  onEmpresaChange: (value: string) => void;
  modalidades: string[];
  filtroModalidade: string;
  onModalidadeChange: (value: string) => void;
  cargos: string[];
  filtroCargo: string;
  onCargoChange: (value: string) => void;
  filtroBusca: string;
  onBuscaChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function VagaFiltersDesktop({
  filtroPlataforma,
  onPlataformaChange,
  empresas,
  filtroEmpresa,
  onEmpresaChange,
  modalidades,
  filtroModalidade,
  onModalidadeChange,
  cargos,
  filtroCargo,
  onCargoChange,
  filtroBusca,
  onBuscaChange,
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
        value={filtroPlataforma}
        onChange={e => onPlataformaChange(e.target.value)}
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
        options={empresas}
        value={filtroEmpresa || null}
        onChange={(_, v) => onEmpresaChange(v || '')}
        renderInput={(params) => (
          <TextField {...params} placeholder="TODAS EMPRESAS" size="small" />
        )}
        size="small"
        noOptionsText="Nenhuma"
        disableClearable={false}
      />

      <Autocomplete
        options={modalidades}
        value={filtroModalidade || null}
        onChange={(_, v) => onModalidadeChange(v || '')}
        renderInput={(params) => (
          <TextField {...params} placeholder="MODALIDADES" size="small" />
        )}
        size="small"
        noOptionsText="Nenhuma"
        disableClearable={false}
      />

      <Autocomplete
        options={cargos}
        value={filtroCargo || null}
        onChange={(_, v) => onCargoChange(v || '')}
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
          value={filtroBusca}
          onChange={e => onBuscaChange(e.target.value)}
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
