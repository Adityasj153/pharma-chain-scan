import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pill } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Medicine {
  id: string;
  name: string;
  generic_name: string | null;
  description: string | null;
  dosage_form: string;
  strength: string;
  created_at: string;
}

export default function MedicineList() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMedicines();
  }, [user]);

  const fetchMedicines = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .eq("manufacturer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMedicines(data || []);
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
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Pill className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No medicines found. Create your first medicine to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {medicines.map((medicine) => (
        <Card key={medicine.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              {medicine.name}
            </CardTitle>
            {medicine.generic_name && (
              <CardDescription>{medicine.generic_name}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {medicine.description && (
              <p className="text-sm text-muted-foreground">{medicine.description}</p>
            )}
            <div className="flex gap-2">
              <Badge variant="secondary">{medicine.dosage_form}</Badge>
              <Badge variant="outline">{medicine.strength}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
