import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Pill, Package } from "lucide-react";
import MedicineList from "@/components/manufacturer/MedicineList";
import BatchList from "@/components/manufacturer/BatchList";
import CreateMedicineDialog from "@/components/manufacturer/CreateMedicineDialog";
import CreateBatchDialog from "@/components/manufacturer/CreateBatchDialog";

export default function ManufacturerDashboard() {
  const { signOut } = useAuth();
  const [medicineDialogOpen, setMedicineDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Pill className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">PharmTrack</h1>
                <p className="text-sm text-muted-foreground">Manufacturer Portal</p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="medicines" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="medicines">
                <Pill className="mr-2 h-4 w-4" />
                Medicines
              </TabsTrigger>
              <TabsTrigger value="batches">
                <Package className="mr-2 h-4 w-4" />
                Batches
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <Button onClick={() => setMedicineDialogOpen(true)}>
                <Pill className="mr-2 h-4 w-4" />
                Add Medicine
              </Button>
              <Button onClick={() => setBatchDialogOpen(true)}>
                <Package className="mr-2 h-4 w-4" />
                Create Batch
              </Button>
            </div>
          </div>

          <TabsContent value="medicines" className="space-y-4">
            <MedicineList key={refreshTrigger} />
          </TabsContent>

          <TabsContent value="batches" className="space-y-4">
            <BatchList key={refreshTrigger} />
          </TabsContent>
        </Tabs>
      </main>

      <CreateMedicineDialog 
        open={medicineDialogOpen} 
        onOpenChange={setMedicineDialogOpen}
        onSuccess={handleRefresh}
      />
      
      <CreateBatchDialog 
        open={batchDialogOpen} 
        onOpenChange={setBatchDialogOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
