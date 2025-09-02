"use client";

import { useState } from "react";
import { Input, IconButton, Tooltip } from "@mui/material";
import { Check, X } from "lucide-react";

interface InlineEditFieldProps {
  value: string | number;
  type?: "text" | "number";
  onSave: (newValue: string | number) => void;
}

const InlineEditField = ({ value, onSave, type = "text" }: InlineEditFieldProps) => {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleBlur = () => {
    if (!editing) return;
    onSave(tempValue);
    setEditing(false);
  };

  const handleSave = () => {
    onSave(tempValue);
    setEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setEditing(false);
  };

  return editing ? (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <Input
        value={tempValue}
        onChange={(e) => setTempValue(type === "number" ? +e.target.value : e.target.value)}
        type={type}
        onBlur={handleBlur}
        autoFocus
        size="small"
        sx={{ maxWidth: 100 }}
      />
      <Tooltip title="Confirm">
        <IconButton onClick={handleSave} size="small" color="success">
          <Check size={16} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Cancel">
        <IconButton onClick={handleCancel} size="small" color="error">
          <X size={16} />
        </IconButton>
      </Tooltip>
    </div>
  ) : (
    <span
      onClick={() => setEditing(true)}
      style={{ cursor: "pointer", padding: "2px 6px", display: "inline-block" }}
    >
      {value}
    </span>
  );
};

export default InlineEditField;
