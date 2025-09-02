import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateProductDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (product: any) => void
  isCreating?: boolean
}

const CATEGORY_OPTIONS = ["Collection", "Equipment", "Reagent", "Safety"]
const RATING_OPTIONS = [0, 1, 2, 3, 4, 5]

export function CreateProductDialog({
  isOpen,
  onClose,
  onCreate,
  isCreating = false,
}: CreateProductDialogProps) {
  const [form, setForm] = useState({
    productId: uuidv4(),
    name: "",
    price: "",
    stockQuantity: "",
    rating: 0,
    supplier: "",
    minQuantity: "",
    unit: "",
    category: "",
    expiryDate: "",
      })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  function handleSubmit() {
    const price = parseFloat(form.price)
    const stockQuantity = parseInt(form.stockQuantity)
    const minQuantity = parseInt(form.minQuantity)

    if (price < 0 || stockQuantity < 0 || minQuantity < 0) {
      alert("Price, Stock Quantity, and Minimum Quantity must be non-negative.")
      return
    }

    const payload = {
  ...form,
  price,
  stockQuantity,
  minQuantity,
  rating: Number(form.rating),
  expiryDate: form.expiryDate ? new Date(form.expiryDate) : null,
};


    onCreate(payload)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-6 rounded-2xl border border-neutral-200 bg-white shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900">Create New Product</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Test Tubes" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="$0.00"
                min={0}
              />
            </div>

            <div>
              <Label htmlFor="stockQuantity">Stock Quantity</Label>
              <Input
                type="number"
                name="stockQuantity"
                value={form.stockQuantity}
                onChange={handleChange}
                placeholder="e.g. 100"
                min={0}
              />
            </div>

            <div>
              <Label htmlFor="rating">Rating</Label>
              <Select value={form.rating.toString()} onValueChange={(value) => setForm({ ...form, rating: Number(value) })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Rating" />
                </SelectTrigger>
                <SelectContent>
                  {RATING_OPTIONS.map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input name="supplier" value={form.supplier} onChange={handleChange} placeholder="e.g. MedTech Co." />
            </div>

            <div>
              <Label htmlFor="minQuantity">Minimum Quantity</Label>
              <Input
                type="number"
                name="minQuantity"
                value={form.minQuantity}
                onChange={handleChange}
                placeholder="e.g. 10"
                min={0}
              />
            </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input name="unit" value={form.unit} onChange={handleChange} placeholder="e.g. box, ml, tubes" />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                type="date"
                name="expiryDate"
                value={form.expiryDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
