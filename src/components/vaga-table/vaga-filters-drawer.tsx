'use client';

import { Box, Typography, TextField, Button, Select, MenuItem, Autocomplete, Drawer, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface Props {
  open: boolean;
  onClose: () => void;
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
  totalFiltradas: number;
  countSecondaryFilters: number;
  onClearFilters: () => void;
}

export function VagaFiltersDrawer({
  open,
  onClose,
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
  totalFiltradas,
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
          borderTop: '4px solid #020617',
          bgcolor: '#ffffff',
          p: 2.5,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          maxHeight: '85vh',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1, borderBottom: '2px solid #020617' }}>
        <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', color: '#020617', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
          ⚡ FILTROS AVANÇADOS
        </Typography>
        <IconButton onClick={onClose} size="small" aria-label="Fechar filtros" sx={{ border: '2px solid #020617', borderRadius: 0, p: 0.5, color: '#020617' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', mb: 0.75, fontFamily: 'ui-monospace, monospace' }}>
            Plataforma
          </Typography>
          <Select
            fullWidth
            value={filtroPlataforma}
            onChange={e => onPlataformaChange(e.target.value)}
            displayEmpty
            size="small"
            sx={{
              backgroundColor: '#ffffff',
              borderRadius: 0,
              border: '2px solid #020617',
              fontSize: '0.85rem',
              fontWeight: 700,
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            <MenuItem value="">TODAS AS PLATAFORMAS</MenuItem>
            <MenuItem value="Gupy">GUPY</MenuItem>
            <MenuItem value="InHire">INHIRE</MenuItem>
          </Select>
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', mb: 0.75, fontFamily: 'ui-monospace, monospace' }}>
            Empresa
          </Typography>
          <Autocomplete
            options={empresas}
            value={filtroEmpresa || null}
            onChange={(_, v) => onEmpresaChange(v || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="SELECIONE UMA EMPRESA" size="small" />
            )}
            size="small"
            noOptionsText="Nenhuma empresa encontrada"
            disableClearable={false}
          />
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', mb: 0.75, fontFamily: 'ui-monospace, monospace' }}>
            Modalidade
          </Typography>
          <Autocomplete
            options={modalidades}
            value={filtroModalidade || null}
            onChange={(_, v) => onModalidadeChange(v || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="SELECIONE A MODALIDADE" size="small" />
            )}
            size="small"
            noOptionsText="Nenhuma opção"
            disableClearable={false}
          />
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', mb: 0.75, fontFamily: 'ui-monospace, monospace' }}>
            Cargo
          </Typography>
          <Autocomplete
            options={cargos}
            value={filtroCargo || null}
            onChange={(_, v) => onCargoChange(v || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="SELECIONE O CARGO" size="small" />
            )}
            size="small"
            noOptionsText="Nenhum cargo encontrado"
            disableClearable={false}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button
          onClick={onClose}
          fullWidth
          variant="contained"
          sx={{
            borderRadius: 0,
            border: '2px solid #020617',
            bgcolor: '#020617',
            color: '#ccff00',
            boxShadow: '3px 3px 0px #000',
            fontWeight: 900,
            fontFamily: 'ui-monospace, monospace',
            py: 1.25,
            fontSize: '0.85rem',
            '&:hover': {
              bgcolor: '#1e293b',
            },
          }}
        >
          VER {totalFiltradas} VAGAS →
        </Button>

        {countSecondaryFilters > 0 && (
          <Button
            onClick={() => {
              onClearFilters();
              onClose();
            }}
            sx={{
              borderRadius: 0,
              border: '2px solid #020617',
              bgcolor: '#ffffff',
              color: '#ef4444',
              boxShadow: '3px 3px 0px #000',
              fontWeight: 900,
              fontFamily: 'ui-monospace, monospace',
              px: 2,
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
            }}
          >
            LIMPAR
          </Button>
        )}
      </Box>
    </Drawer>
  );
}
