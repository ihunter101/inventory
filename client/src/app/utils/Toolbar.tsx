import * as React from "react";
import {
  GridToolbarQuickFilter,
  GridCsvExportMenuItem,
  useGridApiContext,
  useGridSelector,
  gridFilteredSortedRowIdsSelector,
} from "@mui/x-data-grid";
import {
  Toolbar,
  Box,
  Button,
  TextField,
} from "@mui/material";

const CustomToolbar = () => {
  const apiRef = useGridApiContext();

  const handleExport = () => {
    // Optional export logic
    apiRef.current.exportDataAsCsv(); // built-in export
  };

  return (
    <Toolbar sx={{ display: "flex", justifyContent: "space-between", p: 1 }}>
      <TextField
        size="small"
        placeholder="Search..."
        onChange={(e) =>
          apiRef.current.setQuickFilterValues([e.target.value])
        }
      />
      <Box>
        <Button variant="outlined" onClick={handleExport}>
          Export CSV
        </Button>
      </Box>
    </Toolbar>
  );
};

export default CustomToolbar;
