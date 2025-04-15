
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Aircraft, PilotRecord } from '@/types';

interface FilterOptionsProps {
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  selectedAircraft: string;
  setSelectedAircraft: (value: string) => void;
  selectedPilot: string;
  setSelectedPilot: (value: string) => void;
  resetFilters: () => void;
  uniqueYears: number[];
  aircraft: Aircraft[];
  pilots: PilotRecord[];
  isLoading?: boolean;
}

export function FilterOptions({
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedAircraft,
  setSelectedAircraft,
  selectedPilot,
  setSelectedPilot,
  resetFilters,
  uniqueYears,
  aircraft,
  pilots,
  isLoading = false
}: FilterOptionsProps) {
  return (
    <div className="mb-6 p-4 border rounded-lg bg-blue-50/40 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium flex items-center gap-2 text-primary">
          <Filter className="h-5 w-5" />
          <span>Filter Options</span>
        </h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1 text-muted-foreground">Month</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isLoading}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-months">All Months</SelectItem>
              <SelectItem value="1">January</SelectItem>
              <SelectItem value="2">February</SelectItem>
              <SelectItem value="3">March</SelectItem>
              <SelectItem value="4">April</SelectItem>
              <SelectItem value="5">May</SelectItem>
              <SelectItem value="6">June</SelectItem>
              <SelectItem value="7">July</SelectItem>
              <SelectItem value="8">August</SelectItem>
              <SelectItem value="9">September</SelectItem>
              <SelectItem value="10">October</SelectItem>
              <SelectItem value="11">November</SelectItem>
              <SelectItem value="12">December</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium block mb-1 text-muted-foreground">Year</label>
          <Select value={selectedYear} onValueChange={setSelectedYear} disabled={isLoading}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-years">All Years</SelectItem>
              {uniqueYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium block mb-1 text-muted-foreground">Aircraft</label>
          <Select value={selectedAircraft} onValueChange={setSelectedAircraft} disabled={isLoading || !aircraft.length}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="All Aircraft" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-aircraft">All Aircraft</SelectItem>
              {aircraft.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  {a.tailNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium block mb-1 text-muted-foreground">Pilot</label>
          <Select value={selectedPilot} onValueChange={setSelectedPilot} disabled={isLoading || !pilots.length}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="All Pilots" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-pilots">All Pilots</SelectItem>
              {pilots
                .filter(p => !p.isHidden)
                .map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-end">
          <Button 
            variant="outline" 
            className="w-full bg-white hover:bg-blue-50"
            onClick={resetFilters}
            disabled={isLoading}
          >
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
