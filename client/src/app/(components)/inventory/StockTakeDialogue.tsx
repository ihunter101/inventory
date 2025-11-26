import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Stocktake</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 1.5 }}>
          Set quantity for <strong>{item?.name}</strong>
        </Typography>
        <TextField
          fullWidth
          label="Counted Quantity"
          type="number"
          value={count}
          onChange={(e) =>
            setCount(e.target.value === "" ? "" : Number(e.target.value))
          }
          sx={{ mt: 1.5 }}
        />
        <TextField
          fullWidth
          label="Counted At"
          type="datetime-local"
          value={new Date(countDate).toISOString().slice(0, 16)}
          onChange={(e) =>
            setCountDate(new Date(e.target.value).toISOString())
          }
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={typeof count !== "number" || isSaving}
          startIcon={<StocktakeIcon />}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

