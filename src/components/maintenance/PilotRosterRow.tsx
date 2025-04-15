
import { PilotRecord } from '@/types';
import { Edit, Trash2, EyeOff, Eye, ShieldCheck, ShieldOff } from 'lucide-react';
import { TableRow, TableCell } from "@/components/ui/table";

interface PilotRosterRowProps {
  pilot: PilotRecord;
  onEdit: (pilot: PilotRecord) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, isHidden: boolean) => void;
  onToggleAdmin: (id: string, isAdmin: boolean) => void;
  currentUserIsAdmin: boolean;
}

export function PilotRosterRow({
  pilot,
  onEdit,
  onDelete,
  onToggleVisibility,
  onToggleAdmin,
  currentUserIsAdmin
}: PilotRosterRowProps) {
  return (
    <TableRow className={pilot.isHidden ? "opacity-60" : ""}>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-medium">{pilot.name}</span>
          {pilot.isAdmin && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
              Admin
            </span>
          )}
          {pilot.isHidden && (
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">
              Hidden
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {currentUserIsAdmin && (
            <>
              <button
                onClick={() => onToggleAdmin(pilot.id, !pilot.isAdmin)}
                className="p-1 rounded-md hover:bg-blue-100 text-blue-700 transition-colors"
                aria-label={pilot.isAdmin ? "Remove admin rights" : "Make admin"}
                title={pilot.isAdmin ? "Remove admin rights" : "Make admin"}
              >
                {pilot.isAdmin ? (
                  <ShieldOff className="h-4 w-4" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => onToggleVisibility(pilot.id, !pilot.isHidden)}
                className={`p-1 rounded-md hover:bg-secondary transition-colors`}
                aria-label={pilot.isHidden ? "Show pilot" : "Hide pilot"}
                title={pilot.isHidden ? "Show pilot" : "Hide pilot"}
              >
                {pilot.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </>
          )}
          <button
            onClick={() => onEdit(pilot)}
            className={`p-1 rounded-md hover:bg-secondary ${currentUserIsAdmin  ? 'hover:bg-secondary' : 'cursor-not-allowed opacity-50'} transition-colors"
            aria-label="Edit pilot`}
            title="Edit pilot"
            disabled={!currentUserIsAdmin}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(pilot.id)}
            className={`p-1 rounded-md hover:bg-red-100 ${currentUserIsAdmin
 ? 'hover:bg-secondary' : 'cursor-not-allowed opacity-50'} text-red-500 transition-colors`}
            aria-label="Delete pilot"
            title="Delete pilot"
            disabled={!currentUserIsAdmin}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
