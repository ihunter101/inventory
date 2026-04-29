"use client";

import * as React from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ width: "100%" }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          mb: 3,
          px: 3,
          py: 2,
          bgcolor: "background.paper",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Client Portal
            </Typography>

            <Typography variant="body2" color="text.secondary">
              View invoices, balances, and account activity.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              component={Link}
              href="/client/dashboard"
              startIcon={<DashboardIcon />}
              variant="outlined"
            >
              Dashboard
            </Button>

            <Button
              component={Link}
              href="/client/invoices"
              startIcon={<ReceiptLongIcon />}
              variant="contained"
            >
              Invoices
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Container maxWidth="xl" disableGutters>
        {children}
      </Container>
    </Box>
  );
}