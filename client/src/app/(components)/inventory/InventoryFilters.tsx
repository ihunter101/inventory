import * as React from "react";
import {
  Card,
  CardContent,
  Stack,
  TextField,
  MenuItem,
  Box,
  CircularProgress,
} from "@mui/material";
import type { Status } from "../../utils/stock";
import type { Category } from "./InventoryTypes";

type Props = {
  status: "all" | Status;
  category: "all" | Category;
  onStatusChange: (v: "all" | Status) => void;
  onCategoryChange: (v: "all" | Category) => void;
  isBusy: boolean;
};

export const InventoryFilters: React.FC<Props> = ({
  status,
  category,
  onStatusChange,
  onCategoryChange,
  isBusy,
}) => {
  return (
    <Card sx={{ mb: 2, borderRadius: "16px", boxShadow: 3 }}>
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            select
            label="Category"
            size="small"
            sx={{
              minWidth: 180,
              bgcolor: "white",
              borderRadius: 1,
              "& .MuiOutlinedInput-root": { borderRadius: "10px" },
            }}
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as any)}
          >
            <MenuItem value="all">All Categories</MenuItem>
            <MenuItem value="Collection">Collection</MenuItem>
            <MenuItem value="Equipment">Equipment</MenuItem>
            <MenuItem value="Reagent">Reagent</MenuItem>
            <MenuItem value="Safety">Safety</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>

          <TextField
            select
            label="Status"
            size="small"
            sx={{
              minWidth: 180,
              bgcolor: "white",
              borderRadius: 1,
              "& .MuiOutlinedInput-root": { borderRadius: "10px" },
            }}
            value={status}
            onChange={(e) => onStatusChange(e.target.value as any)}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="in-stock">In Stock</MenuItem>
            <MenuItem value="low-stock">Low Stock</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
          </TextField>

          <Box sx={{ flexGrow: 1 }} />
          {isBusy && <CircularProgress size={22} />}
        </Stack>
      </CardContent>
    </Card>
  );
};

