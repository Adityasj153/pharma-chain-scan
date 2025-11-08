import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Calendar, MapPin, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QRCode from "qrcode";
import type { Database } from "@/integrations/supabase/types";

interface Batch {
  id: string;
  batch_number: string;
  qr_code: string;
  quantity: number;
  manufacturing_date: string;
  expiry_date: string;
  status: string;
  current_location: string | null;
  medicines: {
    name: string;
    dosage_form: string;
    strength: string;
  };
}

export default function BatchList() {
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
        .eq("manufacturer_id", user.id)
        .order("created_at", { ascending: false });

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

  const downloadQRCode = async (qrCode: string, batchNumber: string) => {
    try {
      const url = await QRCode.toDataURL(qrCode, { width: 400 });
      const link = document.createElement("a");
      link.href = url;
      link.download = `QR-${batchNumber}.png`;
      link.click();
      
      toast({
        title: "Success",
        description: "QR code downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      });
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

  const handleStatusChange = async (batchId: string, newStatus: Database["public"]["Enums"]["batch_status"]) => {
    try {
      const { error } = await supabase
        .from("batches")
        .update({ status: newStatus })
        .eq("id", batchId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Batch status changed to ${getStatusLabel(newStatus)}`,
      });

      fetchBatches();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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
            No batches found. Create your first batch to get started.
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
              <TableHead>Update Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>QR Code</TableHead>
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
                  <Select
                    value={batch.status}
                    onValueChange={(value) => handleStatusChange(batch.id, value as Database["public"]["Enums"]["batch_status"])}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">Created</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {batch.current_location && (
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      {batch.current_location}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadQRCode(batch.qr_code, batch.batch_number)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
