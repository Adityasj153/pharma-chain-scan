import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Batch {
  id: string;
  batch_number: string;
  quantity: number;
  manufacturing_date: string;
  expiry_date: string;
  status: string;
  delivery_confirmed_at: string | null;
  medicines: {
    name: string;
    dosage_form: string;
    strength: string;
  };
}

export default function ReceivedBatchList() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchBatches();
  }, [user]);

  const fetchBatches = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("batches")
        .select(`
          *,
          medicines (
            name,
            dosage_form,
            strength
          )
        `)
        .eq("pharmacist_id", user.id)
        .order("delivery_confirmed_at", { ascending: false });

      if (error) throw error;
      setBatches(data || []);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "created":
        return "bg-secondary";
      case "in_transit":
        return "bg-warning";
      case "delivered":
        return "bg-primary";
      case "received":
        return "bg-success";
      default:
        return "bg-muted";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No batches received yet. Scan QR codes to confirm deliveries.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch Number</TableHead>
              <TableHead>Medicine</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Manufacturing</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Received On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell className="font-medium">{batch.batch_number}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{batch.medicines.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {batch.medicines.dosage_form} - {batch.medicines.strength}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{batch.quantity} units</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {new Date(batch.manufacturing_date).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {new Date(batch.expiry_date).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(batch.status)}>
                    {getStatusLabel(batch.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {batch.delivery_confirmed_at && (
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {new Date(batch.delivery_confirmed_at).toLocaleDateString()}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
