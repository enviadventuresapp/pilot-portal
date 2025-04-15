
"use client"

import { AircraftMaintenance } from "@/components/maintenance/AircraftMaintenance"
import { PilotRoster } from "@/components/maintenance/PilotRoster"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthContext } from "@/contexts/AuthContext"

export function MaintenanceAdmin() {
  const { isAdmin } = useAuthContext()
  const navigate = useNavigate()

  // Ensure only admins can access this component
  useEffect(() => {
    if (!isAdmin) {
      navigate("/unauthorized")
    }
  }, [isAdmin, navigate])

  return (
    <div className="space-y-8">
      <div className="rounded-md border bg-card">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Aircraft Maintenance</h3>
          <AircraftMaintenance isUserAdmin={true} />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Pilot Roster</h3>
          <PilotRoster isAdmin={true} />
        </div>
      </div>
    </div>
  )
}
