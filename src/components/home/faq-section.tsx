"use client";

import { Container, Box, Typography } from "@mui/material";
import { FAQ_ITEMS } from "@/lib/constants/home";

export function FaqSection() {
  return (
    <Box className="section-faq">
      <Container maxWidth="xl" sx={{ py: { xs: 6, md: 8 } }}>
        <Box className="badge-dark" sx={{ mb: 4 }}>
          FAQ
        </Box>
        <Typography
          component="h2"
          sx={{
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            color: "#020617",
            fontSize: { xs: "2rem", md: "3rem" },
            mb: 6,
            lineHeight: 0.9,
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
