"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  Home,
  PlaneTakeoff,
  Shield,
  Wrench,
  BarChart3,
  Users2,
  FileText,
  Target,
  Settings,
  User,
  X,
} from "lucide-react"
import { useAuthContext } from "@/contexts/AuthContext"

interface SidebarProps {
  isOpen: boolean
  toggleSidebar: () => void
}

export function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const location = useLocation()
  const { isAdmin } = useAuthContext()
  const [activeItem, setActiveItem] = useState("")

  useEffect(() => {
    // Extract the first part of the path
    const path = location.pathname.split("/")[1] || "dashboard"
    setActiveItem(path)
  }, [location])

  const isActive = (path: string) => {
    return activeItem === path
  }

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex h-full flex-col border-r bg-background transition-all duration-300",
        isOpen ? "w-64" : "w-20",
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-6">
        <Link to="/" className={cn("flex items-center gap-2", isOpen ? "justify-start" : "justify-center")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
            {/* <span className="text-xs text-slate-500">BETA</span> */}
          </div>
          {/* {isOpen && <span className="text-xl font-medium">Pilot Portal</span>} */}
        </Link>
        {/* {isOpen && (
          <button onClick={toggleSidebar} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        )} */}
      </div>

      <div className="flex-1 overflow-auto py-2">
        {isOpen && (
          <div className="px-3 py-2">
            <p className="mb-2 text-xs font-medium text-gray-500">MAIN</p>
          </div>
        )}
        <nav className="grid gap-1 px-2">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              isActive("dashboard") || isActive("") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              !isOpen && "justify-center",
            )}
          >
            <Home className="h-5 w-5" />
            {isOpen && <span>Dashboard</span>}
          </Link>

          <Link
            to="/flights"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              isActive("flights") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              !isOpen && "justify-center",
            )}
          >
            <PlaneTakeoff className="h-5 w-5" />
            {isOpen && <span>Flights</span>}
          </Link>

          <Link
            to="/safety"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              isActive("safety") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              !isOpen && "justify-center",
            )}
          >
            <Shield className="h-5 w-5" />
            {isOpen && <span>Safety SMS</span>}
          </Link>

          <Link
            to="/maintenance"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              isActive("maintenance") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              !isOpen && "justify-center",
            )}
          >
            <Wrench className="h-5 w-5" />
            {isOpen && <span>Maintenance</span>}
          </Link>

          {isOpen && (
            <div className="px-3 py-2 mt-2">
              <p className="mb-2 text-xs font-medium text-gray-500">ANALYTICS</p>
            </div>
          )}

          <Link
            to="/flight-summary"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              isActive("flight-summary") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              !isOpen && "justify-center",
            )}
          >
            <BarChart3 className="h-5 w-5" />
            {isOpen && <span>Flight Summary</span>}
          </Link>

          <Link
            to="/passenger-summary"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              isActive("passenger-summary") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              !isOpen && "justify-center",
            )}
          >
            <Users2 className="h-5 w-5" />
            {isOpen && <span>Passenger Stats</span>}
          </Link>

          <Link
            to="/fuel-analysis"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              isActive("fuel-analysis") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              !isOpen && "justify-center",
            )}
          >
            <FileText className="h-5 w-5" />
            {isOpen && <span>Fuel Analysis</span>}
          </Link>

          <Link
            to="/route-analytics"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              isActive("route-analytics") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              !isOpen && "justify-center",
            )}
          >
            <Target className="h-5 w-5" />
            {isOpen && <span>Route Analytics</span>}
          </Link>

          {isOpen && (
            <div className="px-3 py-2 mt-2">
              <p className="mb-2 text-xs font-medium text-gray-500">ADMINISTRATION</p>
            </div>
          )}

          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              isActive("settings") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              !isOpen && "justify-center",
            )}
          >
            <Settings className="h-5 w-5" />
            {isOpen && <span>Settings</span>}
          </Link>

          <Link
            to="/profile"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              isActive("profile") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              !isOpen && "justify-center",
            )}
          >
            <User className="h-5 w-5" />
            {isOpen && <span>Profile</span>}
          </Link>
        </nav>
      </div>

      {isOpen && (
        <div className="mt-auto border-t p-4">
          <div className="text-xs text-muted-foreground">Pilot Portal v1.0</div>
        </div>
      )}
    </div>
  )
}
