import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  Box,
} from "@mui/material";
import { Inventory2 as StocktakeIcon } from "@mui/icons-material";

type StocktakeItem = {
  productId: string;
  name: string;
  unit?: string;
  current: number;
};

type Props = {
  open: boolean;
  item: StocktakeItem | null;
  onClose: () => void;
  onSave: (args: {
    productId: string;
    quantity: number;
    countedAt: string;
  }) => Promise<void> | void;
  isSaving?: boolean;
};

export const StocktakeDialog: React.FC<Props> = ({
  open,
  item,
  onClose,
  onSave,
  isSaving,
}) => {
  const [count, setCount] = React.useState<number | "">("");
  const [countDate, setCountDate] = React.useState<string>(
    () => new Date().toISOString()
  );

  React.useEffect(() => {
    if (item && open) {
      setCount(item.current);
      setCountDate(new Date().toISOString());
    }
  }, [item, open]);

  const handleSave = async () => {
    if (!item || typeof count !== "number") return;
    await onSave({
      productId: item.productId,
      quantity: count,
      countedAt: countDate,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        className: "rounded-2xl border border-border/60 bg-card text-foreground shadow-xl",
      }}
    >
      <DialogTitle
        className="border-b border-border/60 text-foreground"
        sx={{ pb: 2 }}
      >
        <Box className="flex items-center gap-2">
          <Box className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <StocktakeIcon className="text-primary" fontSize="small" />
          </Box>
          <Box>
            <Typography
              component="div"
              sx={{ fontWeight: 700, fontSize: "1rem" }}
              className="text-foreground"
            >
              Stocktake
            </Typography>
            <Typography
              component="div"
              variant="body2"
              className="text-muted-foreground"
            >
              Update the counted stock quantity
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box className="mb-4 rounded-xl border border-border/60 bg-muted/30 p-3">
          <Typography className="text-sm text-muted-foreground">
            Set quantity for
          </Typography>
          <Typography
            sx={{ mt: 0.5, fontWeight: 700 }}
            className="text-foreground"
          >
            {item?.name ?? "—"}
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.5 }}
            className="text-muted-foreground"
          >
            Current stock:{" "}
            <span className="font-semibold text-foreground">
              {item?.current ?? 0} {item?.unit ?? "pcs"}
            </span>
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Counted Quantity"
          type="number"
          value={count}
          onChange={(e) =>
            setCount(e.target.value === "" ? "" : Number(e.target.value))
          }
          sx={{
            mt: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              backgroundColor: "hsl(var(--background))",
            },
            "& .MuiInputLabel-root": {
              color: "hsl(var(--muted-foreground))",
            },
            "& .MuiOutlinedInput-input": {
              color: "hsl(var(--foreground))",
            },
          }}
        />

        <TextField
          fullWidth
          label="Counted At"
          type="datetime-local"
          value={new Date(countDate).toISOString().slice(0, 16)}
          onChange={(e) => setCountDate(new Date(e.target.value).toISOString())}
          sx={{
            mt: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              backgroundColor: "hsl(var(--background))",
            },
            "& .MuiInputLabel-root": {
              color: "hsl(var(--muted-foreground))",
            },
            "& .MuiOutlinedInput-input": {
              color: "hsl(var(--foreground))",
            },
          }}
        />
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 1,
          borderTop: "1px solid hsl(var(--border) / 0.6)",
        }}
      >
        <Button
          onClick={onClose}
          disabled={isSaving}
          variant="outlined"
          sx={{
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 600,
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--foreground))",
          }}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          variant="contained"
          disabled={typeof count !== "number" || isSaving}
          startIcon={<StocktakeIcon />}
          sx={{
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "none",
            px: 2,
          }}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};