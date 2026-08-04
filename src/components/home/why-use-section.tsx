"use client";

import { Container, Box, Typography } from "@mui/material";
import { WHY_USE_ITEMS } from "@/lib/constants/home";

export function WhyUseSection() {
  return (
    <Box className="section-white" sx={{ borderTop: "4px solid #020617" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 3 } }}>
        <Box className="badge-dark" sx={{ mb: { xs: 2.5, sm: 4 } }}>
          POR QUE USAR
        </Box>
        <Typography
          component="h2"
          sx={{
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            color: "#020617",
            fontSize: { xs: "1.65rem", sm: "2.25rem", md: "3rem" },
            mb: { xs: 3.5, md: 6 },
            lineHeight: 0.95,
          }}
        >
          TUDO QUE VOCÊ PRECISA
          <br />
          PARA SE RELOCAR
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 3,
          }}
        >
          {WHY_USE_ITEMS.map((item) => (
            <Box key={item.title} className="card-brutalist" sx={{ p: 3 }}>
              <Typography
                sx={{
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                  fontSize: "1.1rem",
                  mb: 1.5,
                  color: "#020617",
                }}
              >
                {item.title}
              </Typography>
              <Typography
                sx={{
                  color: "#475569",
                  fontSize: "0.85rem",
                  lineHeight: 1.6,
                }}
              >
                {item.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
