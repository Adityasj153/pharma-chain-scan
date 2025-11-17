import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, AlertTriangle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, differenceInDays, isPast, isWithinInterval, addDays } from "date-fns";

interface MedicineStock {
  medicine_id: string;
  medicine_name: string;
  generic_name: string;
  strength: string;
  dosage_form: string;
  total_quantity: number;
  batches: {
    batch_number: string;
    quantity: number;
    expiry_date: string;
    manufacturing_date: string;
  }[];
  nearest_expiry: string;
}

export default function AvailableMedicinesTable() {
  const [medicines, setMedicines] = useState<MedicineStock[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMedicines();

    // Subscribe to real-time updates for inventory changes
    const channel = supabase
      .channel('pharmacy-inventory')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'batches',
          filter: `pharmacist_id=eq.${user?.id}`
        },
        () => {
          fetchMedicines();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchMedicines = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("batches")
        .select(`
          id,
          quantity,
          batch_number,
          expiry_date,
          manufacturing_date,
          medicines (
            id,
            name,
            generic_name,
            dosage_form,
            strength
          )
        `)
        .eq("pharmacist_id", user.id)
        .eq("status", "received");

      if (error) throw error;

      // Group by medicine
      const medicineMap = new Map<string, MedicineStock>();
      
      data?.forEach((batch: any) => {
        const medicine = batch.medicines;
        if (!medicine) return;

        const existing = medicineMap.get(medicine.id);
        const batchInfo = {
          batch_number: batch.batch_number,
          quantity: batch.quantity,
          expiry_date: batch.expiry_date,
          manufacturing_date: batch.manufacturing_date,
        };

        if (existing) {
          existing.total_quantity += batch.quantity;
          existing.batches.push(batchInfo);
          
          // Update nearest expiry if this batch expires sooner
          if (new Date(batch.expiry_date) < new Date(existing.nearest_expiry)) {
            existing.nearest_expiry = batch.expiry_date;
          }
        } else {
          medicineMap.set(medicine.id, {
            medicine_id: medicine.id,
            medicine_name: medicine.name,
            generic_name: medicine.generic_name,
            strength: medicine.strength,
            dosage_form: medicine.dosage_form,
            total_quantity: batch.quantity,
            batches: [batchInfo],
            nearest_expiry: batch.expiry_date,
          });
        }
      });

      setMedicines(Array.from(medicineMap.values()));
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

  const getExpiryStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (isPast(expiry)) {
      return {
        label: "Expired",
        className: "bg-destructive text-destructive-foreground",
        urgent: true,
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        label: `Expires in ${daysUntilExpiry} days`,
        className: "bg-warning text-warning-foreground",
        urgent: true,
      };
    } else if (daysUntilExpiry <= 90) {
      return {
        label: `${daysUntilExpiry} days left`,
        className: "bg-secondary text-secondary-foreground",
        urgent: false,
      };
    } else {
      return {
        label: format(expiry, "MMM dd, yyyy"),
        className: "bg-success/20 text-success-foreground",
        urgent: false,
      };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (medicines.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No medicines in inventory yet. Scan QR codes to add medicines.
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
              <TableHead>Medicine Name</TableHead>
              <TableHead>Generic Name</TableHead>
              <TableHead>Strength</TableHead>
              <TableHead>Form</TableHead>
              <TableHead>Total Qty</TableHead>
              <TableHead>Batches</TableHead>
              <TableHead>Nearest Expiry</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medicines.map((medicine) => {
              const expiryStatus = getExpiryStatus(medicine.nearest_expiry);
              return (
                <TableRow 
                  key={medicine.medicine_id}
                  className={expiryStatus.urgent ? "bg-destructive/5" : ""}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {expiryStatus.urgent && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="font-medium">{medicine.medicine_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {medicine.generic_name || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{medicine.strength}</Badge>
                  </TableCell>
                  <TableCell>{medicine.dosage_form}</TableCell>
                  <TableCell className="font-semibold">
                    {medicine.total_quantity}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {medicine.batches.map((batch) => (
                        <div key={batch.batch_number} className="text-xs">
                          <span className="font-mono text-muted-foreground">
                            {batch.batch_number}
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            (Qty: {batch.quantity})
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={expiryStatus.className}>
                      <Calendar className="h-3 w-3 mr-1" />
                      {expiryStatus.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
