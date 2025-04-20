import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, ChevronLeft, Check, Clock, MapPin, Plane, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Aircraft, Flight, PilotRecord } from '@/types';
import { getAllAircraft } from '@/services/aircraftService';
import { getFlightById, createFlight, updateFlight } from '@/services/flightService';
import { getAllPilots } from '@/services/pilotService';
import { Card, CardContent } from '@/components/ui/card';
import { FLIGHT_CATEGORIES, COMMON_ROUTES } from './flightConstants';
import { safeToFixed, ensureNumber, calculateTachDiff } from '@/utils/numberUtils';

const flightSchema = z.object({
  aircraftId: z.string().min(1, { message: "Please select an aircraft." }),
  pilotId: z.string().min(1, { message: "Please select a pilot." }),
  date: z.date({
    required_error: "Please select a date."
  }),
  departureTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: "Please enter time in HH:MM format" 
  }).optional(),
  tachStart: z.number({
    required_error: "Please enter the starting tach time."
  }).min(0, { message: "Tach start must be a positive number." }),
  tachEnd: z.number({
    required_error: "Please enter the ending tach time."
  }).min(0, { message: "Tach end must be a positive number." }),
  hobbsTime: z.number({
    required_error: "Please enter the hobbs time."
  }).min(0, { message: "Hobbs time must be a positive number." }),
  fuelAdded: z.number().optional(),
  oilAdded: z.number().optional(),
  passengerCount: z.number().optional(),
  route: z.string().optional(),
  category: z.string().optional(),
  squawks: z.string().optional(),
  notes: z.string().optional(),
});

type FlightFormValues = z.infer<typeof flightSchema>;

export function FlightForm() {
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [pilots, setPilots] = useState<PilotRecord[]>([]);
  const [loadingAircraft, setLoadingAircraft] = useState(true);
  const [loadingPilots, setLoadingPilots] = useState(true);
  const [existingFlight, setExistingFlight] = useState<Flight | null>(null);
  const [loadingFlight, setLoadingFlight] = useState(false);
  const [pilotsError, setPilotsError] = useState<Error | null>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const form = useForm<FlightFormValues>({
    resolver: zodResolver(flightSchema),
    defaultValues: {
      aircraftId: "",
      pilotId: "",
      date: new Date(),
      departureTime: "",
      tachStart: 0,
      tachEnd: 0,
      hobbsTime: 0,
      fuelAdded: 0,
      oilAdded: 0,
      passengerCount: 0,
      route: "",
      category: "",
      squawks: "",
      notes: "",
    },
  });

  const { control, handleSubmit, formState, watch, setValue, reset } = form;
  const { errors } = formState;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const tachStart = watch('tachStart');
  const tachEnd = watch('tachEnd');
  
  useEffect(() => {
    if (tachStart !== undefined && tachEnd !== undefined) {
      const start = ensureNumber(tachStart);
      const end = ensureNumber(tachEnd);
      const tachDiff = Math.max(0, end - start);
      const hobbsTime = tachDiff * 1.2;
      setValue('hobbsTime', hobbsTime);
    }
  }, [tachStart, tachEnd, setValue]);

  // Fetch data functions remain the same...
  
  useEffect(() => {
    const fetchPilots = async () => {
      try {
        setLoadingPilots(true);
        setPilotsError(null);
        const { success, pilots: fetchedPilots, error } = await getAllPilots();
        
        if (success && fetchedPilots) {
          setPilots(fetchedPilots);
        } else {
          console.error("Error fetching pilots:", error);
          setPilotsError(new Error(error ? error.toString() : "Failed to load pilots"));
          
          toast({
            title: "Error fetching pilots",
            description: "Unable to load the pilots list. You can still create a flight but won't be able to select a pilot.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error in fetchPilots:", error);
        setPilotsError(error instanceof Error ? error : new Error("Unknown error fetching pilots"));
        
        toast({
          title: "Error",
          description: "Failed to load pilots list.",
          variant: "destructive",
        });
      } finally {
        setLoadingPilots(false);
      }
    };

    fetchPilots();
  }, [toast]);

  useEffect(() => {
    const fetchAircraft = async () => {
      try {
        setLoadingAircraft(true);
        const { success, aircraft, error } = await getAllAircraft();
        if (success && aircraft) {
          setAircraftList(aircraft);
        } else {
          toast({
            title: "Error fetching aircraft",
            description: error ? (error as Error).message : "Failed to load aircraft list.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching aircraft:", error);
        toast({
          title: "Error",
          description: "Failed to load aircraft list.",
          variant: "destructive",
        });
      } finally {
        setLoadingAircraft(false);
      }
    };

    fetchAircraft();
  }, [toast]);

  const onSubmit = async (data: FlightFormValues) => {
    setIsSubmitting(true);
    try {
      if (id === 'new') {
        const { success, error } = await createFlight({
          ...data,
          date: format(data.date, 'yyyy-MM-dd')
        }, data.pilotId);
        
        if (success) {
          toast({
            title: "Success",
            description: "Flight created successfully.",
          });
          
          // Reset form to initial state after successful submission
          reset({
            aircraftId: "",
            pilotId: "",
            date: new Date(), // Reset to today's date
            departureTime: "",
            tachStart: 0,
            tachEnd: 0,
            hobbsTime: 0,
            fuelAdded: 0,
            oilAdded: 0,
            passengerCount: 0,
            route: "",
            category: "",
            squawks: "",
            notes: "",
          });
          
          // Focus on date field
          setTimeout(() => {
            const dateInput = document.getElementById('date');
            if (dateInput) dateInput.focus();
          }, 100);
          
        } else {
          throw new Error(error?.message || "Failed to create flight");
        }
      } else if (id) {
        const { success, error } = await updateFlight(id, {
          ...data,
          date: format(data.date, 'yyyy-MM-dd')
        });
        
        if (success) {
          toast({
            title: "Success",
            description: "Flight updated successfully.",
          });
          navigate('/flights');
        } else {
          throw new Error(error?.message || "Failed to update flight");
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit flight data.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      {/* Header and back button remain the same... */}
      
      <Card className="rounded-lg border-0 shadow-md">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* First row - improved grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* Date field */}
              <div className="space-y-2">
                <Label htmlFor="date" className="font-medium flex items-center">
                  Date <span className="text-red-500 ml-1">*</span>
                </Label>
                <Controller
                  control={control}
                  name="date"
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal h-[40px]",
                            !field.value && "text-muted-foreground",
                            errors.date && "border-red-500"
                          )}
                          id="date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "MM/dd/yyyy") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.date && (
                  <p className="text-red-500 text-sm">{errors.date.message}</p>
                )}
              </div>

              {/* Departure Time - changed to time input */}
              <div className="space-y-2">
                <Label htmlFor="departureTime" className="font-medium">
                  Departure Time
                </Label>
                <Input
                  type="time"
                  id="departureTime"
                  className={cn(
                    "w-full bg-white border h-[40px]",
                    errors.departureTime && "border-red-500"
                  )}
                  {...form.register("departureTime")}
                />
                {errors.departureTime && (
                  <p className="text-red-500 text-sm">{errors.departureTime.message}</p>
                )}
              </div>

              {/* Category field */}
              <div className="space-y-2">
                <Label htmlFor="category" className="font-medium">
                  Category
                </Label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ""}
                    >
                      <SelectTrigger className="w-full bg-white border h-[40px]">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 bg-white border shadow-md z-50">
                        {FLIGHT_CATEGORIES.map((category) => (
                          <SelectItem 
                            key={category.value}
                            value={category.value}
                            className="cursor-pointer hover:bg-gray-100"
                          >
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Second row - aircraft and route */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Aircraft field */}
              <div className="space-y-2">
                <Label htmlFor="aircraftId" className="font-medium flex items-center">
                  Aircraft <span className="text-red-500 ml-1">*</span>
                </Label>
                <Controller
                  control={control}
                  name="aircraftId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className={cn(
                        "w-full bg-white border h-[40px]",
                        errors.aircraftId && "border-red-500"
                      )}>
                        <SelectValue placeholder="Select an aircraft" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 bg-white border shadow-md z-50">
                        {aircraftList.length > 0 ? (
                          aircraftList.map((aircraft) => (
                            <SelectItem key={aircraft.id} value={aircraft.id}>
                              {aircraft.tailNumber} ({aircraft.make} {aircraft.model})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>
                            {loadingAircraft ? "Loading..." : "No aircraft available"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.aircraftId && (
                  <p className="text-red-500 text-sm">{errors.aircraftId.message}</p>
                )}
              </div>

              {/* Route field */}
              <div className="space-y-2">
                <Label htmlFor="route" className="font-medium flex items-center">
                  Route <MapPin className="h-4 w-4 ml-1 text-muted-foreground" />
                </Label>
                <Controller
                  control={control}
                  name="route"
                  render={({ field }) => (
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ""}
                    >
                      <SelectTrigger className="w-full bg-white border h-[40px]">
                        <SelectValue placeholder="Select Route" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 bg-white border shadow-md z-50">
                        {COMMON_ROUTES.map((route) => (
                          <SelectItem 
                            key={route.value} 
                            value={route.value}
                            className="cursor-pointer hover:bg-gray-100"
                          >
                            {route.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Third row - pilot, fuel, oil */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* Pilot field */}
              <div className="space-y-2">
                <Label htmlFor="pilotId" className="font-medium flex items-center">
                  Pilot Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Controller
                  control={control}
                  name="pilotId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className={cn(
                        "w-full bg-white border h-[40px]",
                        errors.pilotId && "border-red-500"
                      )}>
                        <SelectValue placeholder="Select Pilot Name" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-md">
                        {loadingPilots ? (
                          <SelectItem value="loading" disabled>Loading pilots...</SelectItem>
                        ) : pilots.length > 0 ? (
                          pilots.map((pilot) => (
                            <SelectItem key={pilot.id} value={pilot.id}>
                              {pilot.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No pilots available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.pilotId && (
                  <p className="text-red-500 text-sm">{errors.pilotId.message}</p>
                )}
              </div>

              {/* Fuel field */}
              <div className="space-y-2">
                <Label htmlFor="fuelAdded" className="font-medium">
                  Fuel Added (gal)
                </Label>
                <Input 
                  type="number" 
                  id="fuelAdded" 
                  step="0.1"
                  placeholder="0.0"
                  className="bg-white h-[40px]"
                  {...form.register("fuelAdded", { valueAsNumber: true })} 
                />
              </div>

              {/* Oil field */}
              <div className="space-y-2">
                <Label htmlFor="oilAdded" className="font-medium">
                  Oil Added (qt)
                </Label>
                <Input 
                  type="number" 
                  id="oilAdded" 
                  step="0.1"
                  placeholder="0.0"
                  className="bg-white h-[40px]"
                  {...form.register("oilAdded", { valueAsNumber: true })} 
                />
              </div>
            </div>

            {/* Fourth row - tach times and passengers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* Tach Start */}
              <div className="space-y-2">
                <Label htmlFor="tachStart" className="font-medium flex items-center">
                  Tach Start <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input 
                  type="number" 
                  id="tachStart" 
                  step="0.1"
                  placeholder="0.0"
                  className={cn(
                    "bg-white h-[40px]",
                    errors.tachStart && "border-red-500"
                  )}
                  {...form.register("tachStart", { valueAsNumber: true })} 
                />
                {errors.tachStart && (
                  <p className="text-red-500 text-sm">{errors.tachStart.message}</p>
                )}
              </div>

              {/* Tach End */}
              <div className="space-y-2">
                <Label htmlFor="tachEnd" className="font-medium flex items-center">
                  Tach End <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input 
                  type="number" 
                  id="tachEnd" 
                  step="0.1"
                  placeholder="0.0"
                  className={cn(
                    "bg-white h-[40px]",
                    errors.tachEnd && "border-red-500"
                  )}
                  {...form.register("tachEnd", { valueAsNumber: true })} 
                />
                {errors.tachEnd && (
                  <p className="text-red-500 text-sm">{errors.tachEnd.message}</p>
                )}
              </div>

              {/* Passengers */}
              <div className="space-y-2">
                <Label htmlFor="passengerCount" className="font-medium">
                  Number of Passengers
                </Label>
                <Input 
                  type="number"
                  id="passengerCount"
                  placeholder="0"
                  className="bg-white h-[40px]"
                  {...form.register("passengerCount", { valueAsNumber: true })} 
                />
              </div>
            </div>

            {/* Fifth row - calculated hobbs time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="space-y-2">
                <Label className="font-medium">
                  Calculated Hobbs Time
                </Label>
                <div className="p-2 bg-gray-50 border rounded-md text-center font-medium h-[40px] flex items-center justify-center">
                  {safeToFixed(watch('hobbsTime'), 1)} hours
                </div>
              </div>
            </div>

            {/* Squawks and Notes - full width */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="squawks" className="font-medium">
                  Aircraft Squawks
                </Label>
                <Textarea 
                  id="squawks" 
                  placeholder="Any issues with the aircraft?"
                  className="bg-white min-h-[100px]"
                  {...form.register("squawks")} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="notes" className="font-medium">
                  Notes
                </Label>
                <Textarea 
                  id="notes" 
                  placeholder="Additional notes about the flight..."
                  className="bg-white min-h-[100px]"
                  {...form.register("notes")} 
                />
              </div>
            </div>

            {/* Form actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/flights')}
                className="bg-white h-[40px]"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                variant="default"
                className="bg-blue-600 hover:bg-blue-700 h-[40px]"
              >
                {isSubmitting ? (
                  <LoadingSpinner /> 
                ) : (
                  <>
                    <Plane className="h-4 w-4 mr-1" />
                    Save Flight
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}