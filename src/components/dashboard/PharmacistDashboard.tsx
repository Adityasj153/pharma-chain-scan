import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Pill, QrCode, Package } from "lucide-react";
import ReceivedBatchList from "@/components/pharmacist/ReceivedBatchList";
import QRScanner from "@/components/pharmacist/QRScanner";

export default function PharmacistDashboard() {
  const { signOut } = useAuth();
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
                <p className="text-sm text-muted-foreground">Pharmacist Portal</p>
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
        <Tabs defaultValue="scan" className="space-y-6">
          <TabsList>
            <TabsTrigger value="scan">
              <QrCode className="mr-2 h-4 w-4" />
              Scan QR Code
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Package className="mr-2 h-4 w-4" />
              My Inventory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4">
            <QRScanner onSuccess={handleRefresh} />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <ReceivedBatchList key={refreshTrigger} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
