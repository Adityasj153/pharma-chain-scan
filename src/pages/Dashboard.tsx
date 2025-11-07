import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import ManufacturerDashboard from "@/components/dashboard/ManufacturerDashboard";
import PharmacistDashboard from "@/components/dashboard/PharmacistDashboard";

export default function Dashboard() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !userRole) return null;

  return (
    <div className="min-h-screen bg-background">
      {userRole === "manufacturer" ? <ManufacturerDashboard /> : <PharmacistDashboard />}
    </div>
  );
}
