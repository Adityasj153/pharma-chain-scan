import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Pill, Package, QrCode, ShieldCheck } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Pill className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold">PharmTrack</h1>
            </div>
            <Button onClick={() => navigate("/auth")}>Get Started</Button>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-5xl font-bold tracking-tight">
              Pharmaceutical Supply Chain Tracking
            </h1>
            <p className="text-xl text-muted-foreground">
              Secure drug inventory management and real-time batch tracking from manufacturer to pharmacy
            </p>
            <div className="flex gap-4 justify-center pt-6">
              <Button size="lg" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                Create Account
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Batch Management</h3>
              <p className="text-muted-foreground">
                Create and manage medicine batches with unique identifiers and complete tracking
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">QR Code System</h3>
              <p className="text-muted-foreground">
                Automated QR code generation for each batch with easy scanning and verification
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Status Tracking</h3>
              <p className="text-muted-foreground">
                Real-time status updates from creation through delivery and receipt confirmation
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
