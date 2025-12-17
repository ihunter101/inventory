import * as React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Add as AddIcon, Download as DownloadIcon } from "@mui/icons-material";
import InventoryPDFDownload, { InventoryItem as PdfItem } from "@/app/pdf/InventoryDocument";

type Props = {
  onAddItem: () => void;
  pdfItems: PdfItem[];
};

export const InventoryHeader: React.FC<Props> = ({ onAddItem, pdfItems  }) => {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      mb={2}
    >
      <Box>
        <Typography variant="h4" fontWeight={700} sx={{ color: "#1a237e" }}>
          Lab Services Inventory
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: "0.95rem" }}>
          Track and manage medical supplies &amp; equipment
        </Typography>
      </Box>

      <Stack direction="row" spacing={1}>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "none",
          }}
          onClick={onAddItem}
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
  );
};

