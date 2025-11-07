import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Medicine {
  id: string;
  name: string;
  dosage_form: string;
  strength: string;
}

interface CreateBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateBatchDialog({ open, onOpenChange, onSuccess }: CreateBatchDialogProps) {
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [formData, setFormData] = useState({
    medicine_id: "",
    batch_number: "",
    quantity: "",
    manufacturing_date: "",
    expiry_date: "",
    current_location: "",
    notes: "",
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      fetchMedicines();
    }
  }, [open, user]);

  const fetchMedicines = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("medicines")
        .select("id, name, dosage_form, strength")
        .eq("manufacturer_id", user.id);

      if (error) throw error;
      setMedicines(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateQRCode = () => {
    return `PHARM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const qrCode = generateQRCode();
      
      const { error } = await supabase.from("batches").insert({
        ...formData,
        quantity: parseInt(formData.quantity),
        qr_code: qrCode,
        manufacturer_id: user.id,
        status: "created",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Batch created successfully with QR code",
      });

      setFormData({
        medicine_id: "",
        batch_number: "",
        quantity: "",
        manufacturing_date: "",
        expiry_date: "",
        current_location: "",
        notes: "",
      });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Batch</DialogTitle>
            <DialogDescription>Create a new batch with unique QR code</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="medicine_id">Medicine *</Label>
              <Select
                value={formData.medicine_id}
                onValueChange={(value) => setFormData({ ...formData, medicine_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a medicine" />
                </SelectTrigger>
                <SelectContent>
                  {medicines.map((medicine) => (
                    <SelectItem key={medicine.id} value={medicine.id}>
                      {medicine.name} - {medicine.dosage_form} ({medicine.strength})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch_number">Batch Number *</Label>
              <Input
                id="batch_number"
                placeholder="e.g., BATCH-2025-001"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Number of units"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturing_date">Manufacturing Date *</Label>
                <Input
                  id="manufacturing_date"
                  type="date"
                  value={formData.manufacturing_date}
                  onChange={(e) => setFormData({ ...formData, manufacturing_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date *</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_location">Current Location</Label>
              <Input
                id="current_location"
                placeholder="e.g., Warehouse A, Section B"
                value={formData.current_location}
                onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this batch"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Batch"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
