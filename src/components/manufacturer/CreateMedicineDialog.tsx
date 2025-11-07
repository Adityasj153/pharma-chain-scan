import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateMedicineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateMedicineDialog({ open, onOpenChange, onSuccess }: CreateMedicineDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    generic_name: "",
    description: "",
    dosage_form: "",
    strength: "",
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("medicines").insert({
        ...formData,
        manufacturer_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Medicine created successfully",
      });

      setFormData({
        name: "",
        generic_name: "",
        description: "",
        dosage_form: "",
        strength: "",
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
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Medicine</DialogTitle>
            <DialogDescription>Add a new medicine to your inventory</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Medicine Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="generic_name">Generic Name</Label>
              <Input
                id="generic_name"
                value={formData.generic_name}
                onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dosage_form">Dosage Form *</Label>
              <Input
                id="dosage_form"
                placeholder="e.g., Tablet, Capsule, Syrup"
                value={formData.dosage_form}
                onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strength">Strength *</Label>
              <Input
                id="strength"
                placeholder="e.g., 500mg, 10ml"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                "Create Medicine"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
