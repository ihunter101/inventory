import * as React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import InventoryPDFDownload, { InventoryItem as PdfItem } from "@/app/pdf/InventoryDocument";

type Props = {
  onAddItem: () => void;
  pdfItems: PdfItem[];
};

export const InventoryHeader: React.FC<Props> = ({ onAddItem, pdfItems }) => {
  return (
    <Box
      className="rounded-2xl border border-border/60 bg-card shadow-sm"
      sx={{ p: { xs: 2, sm: 3 } }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            className="text-foreground"
            sx={{
              fontSize: { xs: "1.5rem", sm: "1.9rem" },
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            Lab Services Inventory
          </Typography>

          <Typography
            className="text-muted-foreground"
            sx={{ fontSize: "0.95rem", mt: 0.75 }}
          >
            Track and manage medical supplies &amp; equipment
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.25} flexWrap="wrap">
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={onAddItem}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
              px: 2,
              py: 1,
            }}
          >
            Add Item
          </Button>

          <InventoryPDFDownload
            items={pdfItems}
            organizationName="Laboratory Services and Consultation Limited"
            department="Tapion"
            preparedBy="Hunter"
            reportType="full"
            notes="Auto-generated inventory report from LSCL inventory system."
          />
        </Stack>
      </Stack>
    </Box>
  );
};