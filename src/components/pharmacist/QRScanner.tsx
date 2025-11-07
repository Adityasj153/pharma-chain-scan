import { useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { QrCode, CheckCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QRScannerProps {
  onSuccess: () => void;
}

export default function QRScanner({ onSuccess }: QRScannerProps) {
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannedBatch, setScannedBatch] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleScan = async (qrCode: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: batch, error } = await supabase
        .from("batches")
        .select(`
          *,
          medicines (
            name,
            dosage_form,
            strength
          )
        `)
        .eq("qr_code", qrCode)
        .single();

      if (error) throw error;

      if (!batch) {
        throw new Error("Batch not found");
      }

      setScannedBatch(batch);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Batch not found",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!user || !scannedBatch) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("batches")
        .update({
          status: "received",
          pharmacist_id: user.id,
          delivery_confirmed_at: new Date().toISOString(),
          current_location: "Pharmacy Inventory",
        })
        .eq("id", scannedBatch.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Delivery confirmed successfully",
      });

      setScannedBatch(null);
      setManualCode("");
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

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(manualCode);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan QR Code
          </CardTitle>
          <CardDescription>
            Scan the QR code on the medicine batch to confirm delivery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qrCode">Enter QR Code Manually</Label>
              <div className="flex gap-2">
                <Input
                  id="qrCode"
                  placeholder="PHARM-XXXXXXXXX"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                />
                <Button type="submit" disabled={loading || !manualCode}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Scan"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {scannedBatch && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Batch Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medicine</p>
                <p className="text-lg font-semibold">{scannedBatch.medicines.name}</p>
                <p className="text-sm text-muted-foreground">
                  {scannedBatch.medicines.dosage_form} - {scannedBatch.medicines.strength}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Batch Number</p>
                  <p className="font-medium">{scannedBatch.batch_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                  <p className="font-medium">{scannedBatch.quantity} units</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Manufacturing Date</p>
                  <p>{new Date(scannedBatch.manufacturing_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
                  <p>{new Date(scannedBatch.expiry_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                <Badge className={getStatusColor(scannedBatch.status)}>
                  {getStatusLabel(scannedBatch.status)}
                </Badge>
              </div>

              {scannedBatch.current_location && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Location</p>
                  <p>{scannedBatch.current_location}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleConfirmDelivery} 
                className="flex-1"
                disabled={loading || scannedBatch.status === "received"}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming...
                  </>
                ) : scannedBatch.status === "received" ? (
                  "Already Received"
                ) : (
                  "Confirm Delivery"
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setScannedBatch(null);
                  setManualCode("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
