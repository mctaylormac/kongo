// [Agent Dev Mobile] - Action: Types globaux pour Kongo Chauffeur
export interface TicketScan {
  id: string;
  booking_id?: string;
  trip_id?: string;
  ticket_code: string;
  client_name: string;
  route: string;
  departure_time: string;
  scan_status: 'valid' | 'already_scanned' | 'invalid' | 'pending_sync';
  scanned_at: string;
  driver_id?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  agency_id?: string;
}
