"use client";

import { Container, Box, Typography } from "@mui/material";
import { FAQ_ITEMS } from "@/lib/constants/home";

export function FaqSection() {
  return (
    <Box className="section-faq">
      <Container maxWidth="xl" sx={{ py: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 3 } }}>
        <Box className="badge-dark" sx={{ mb: { xs: 2.5, sm: 4 } }}>
          FAQ
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
          PERGUNTAS
          <br />
          FREQUENTES
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            maxWidth: 800,
          }}
        >
          {FAQ_ITEMS.map((faq) => (
            <details key={faq.q} className="faq-item">
              <summary>
                <span>{faq.q}</span>
                <span className="faq-arrow">↓</span>
              </summary>
              <div className="faq-content">
                <p>{faq.a}</p>
              </div>
            </details>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
