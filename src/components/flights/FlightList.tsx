import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getAllFlights, deleteFlight } from '@/services/flightService';
import { Flight } from '@/types';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Plus, RefreshCw, Search, Filter, Edit2Icon, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { safeToFixed, calculateTachDiff, ensureNumber } from '@/utils/numberUtils';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuthContext } from '@/contexts/AuthContext';

export function FlightList() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flightToDelete, setFlightToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuthContext();

  const fetchFlights = async () => {
    try {
      setLoading(true);
      setError(null);
      const { success, flights: fetchedFlights, error: fetchError } = await getAllFlights();

      if (success && fetchedFlights) {
        console.log('Loaded flights:', fetchedFlights);
        setFlights(fetchedFlights);
      } else {
        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Failed to load flight data';
        console.error('Error fetching flights:', errorMessage);
        setError(new Error(errorMessage));

        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load flight data. Please try again later."
        });
      }
    } catch (err) {
      console.error('Error in fetchFlights:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load flight data. Please try again later."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, []);

  const handleNewFlightClick = () => {
    navigate('/flights/new');
  };

  const handleFlightClick = (id: string) => {
    navigate(`/flights/${id}`);
  };
  
  const handleEditClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/flights/${id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFlightToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!flightToDelete) return;
    
    try {
      setDeleteLoading(true);
      const { success, error: deleteError } = await deleteFlight(flightToDelete);
      
      if (success) {
        // Remove from local state
        setFlights(flights.filter(flight => flight.id !== flightToDelete));
        toast({
          title: "Success",
          description: "Flight deleted successfully",
        });
      } else {
        const errorMessage = deleteError instanceof Error ? deleteError.message : 'Failed to delete flight';
        console.error('Error deleting flight:', errorMessage);
        
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete flight. Please try again later."
        });
      }
    } catch (err) {
      console.error('Error in confirmDelete:', err);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete flight. Please try again later."
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setFlightToDelete(null);
    }
  };

  const handleRetry = () => {
    fetchFlights();
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Flight Logbook</h1>
          <Button onClick={handleNewFlightClick} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> New Flight
          </Button>
        </div>

        <Card className="border-red-200 bg-red-50 text-red-800">
          <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-10 w-10 mb-2 text-red-500" />
            <h3 className="font-semibold text-lg mb-1">Error</h3>
            <p className="mb-4">Failed to load flight data. Please try again later.</p>
            <Button
              variant="outline"
              className="text-red-800 border-red-200 hover:bg-red-100 flex items-center gap-2"
              onClick={handleRetry}
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Flight Logbook</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search flights..."
              className="pl-10 w-[250px]"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button onClick={handleNewFlightClick} variant="default">
            <Plus className="h-4 w-4 mr-1" /> New Flight
          </Button>
        </div>
      </div>

      {flights.length === 0 ? (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CardTitle className="mb-2 text-gray-700">No flight entries yet</CardTitle>
            <CardDescription className="text-gray-500 mb-6">
              Start by creating your first flight entry.
            </CardDescription>
            <Button
              onClick={handleNewFlightClick}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Create your first flight
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-lg overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Departure Time</TableHead>
                  <TableHead>Aircraft</TableHead>
                  <TableHead>Pilot</TableHead>
                  <TableHead>Tach Total</TableHead>
                  <TableHead>Hobbs</TableHead>
                  <TableHead>Passengers</TableHead>
                  <TableHead>Fuel</TableHead>
                  <TableHead>Oil</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flights.map((flight) => (
                  <TableRow
                    key={flight.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleFlightClick(flight.id)}
                  >
                    <TableCell>
                      {flight.date ? format(new Date(flight.date), 'MM/dd/yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>{flight.departureTime || 'N/A'}</TableCell>
                    <TableCell>{flight.aircraftId}</TableCell>
                    <TableCell>{flight.pilotName || 'Unknown'}</TableCell>
                    <TableCell>{safeToFixed(calculateTachDiff(flight.tachEnd, flight.tachStart), 1)}</TableCell>
                    <TableCell>{safeToFixed(flight.hobbsTime, 1)} hrs</TableCell>
                    <TableCell>{ensureNumber(flight.passengerCount) || '0'}</TableCell>
                    <TableCell>{flight.fuelAdded ? `${safeToFixed(flight.fuelAdded, 1)} gal` : 'None'}</TableCell>
                    <TableCell>{flight.oilAdded ? `${safeToFixed(flight.oilAdded, 1)} qt` : 'None'}</TableCell>
                    <TableCell>{flight.route || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFlightClick(flight.id);
                          }}
                        >
                          View
                        </Button>
                        
                        {isAdmin && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-blue-600"
                              onClick={(e) => handleEditClick(e, flight.id)}
                            >
                              <Edit2Icon className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-600"
                              onClick={(e) => handleDeleteClick(e, flight.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this flight?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the flight record from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}