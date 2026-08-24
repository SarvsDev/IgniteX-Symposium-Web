export type EventCategory = 'technical' | 'non-technical';
export type EventDay = 'Day 1' | 'Day 2';
export type UserRole = 'user' | 'admin';

export interface Coordinator {
  name: string;
  phone: string;
  role: string;
}

export interface EventRound {
  roundNumber: number | string;
  roundName: string;
  duration?: string;
  description: string;
  details?: string[];
  scoring?: string;
}

export interface EvaluationCriterion {
  criterion: string;
  weightage?: string;
  description?: string;
}

export interface PrizeBreakdown {
  place: string;
  prize: string;
}

export interface RuleBook {
  eventOverview?: string;
  eventFormatSummary?: string;
  rounds: EventRound[];
  rulesAndRegulations?: string[];
  evaluationCriteria: EvaluationCriterion[];
  participantFlow?: string[];
  facilitiesProvided?: string[];
  topics?: string[];
  prizeStructure?: PrizeBreakdown[];
}

export interface SymposiumEvent {
  id: string;
  title: string;
  tagline: string;
  category: EventCategory;
  day: EventDay;
  time: string;
  venue: string;
  teamSize: string;
  maxTeamSize: number;
  entryFee: number;
  prizePool: string;
  shortDescription: string;
  fullDescription: string;
  rules: string[];
  ruleBook?: RuleBook;
  coordinators: Coordinator[];
  slotsTotal: number;
  slotsFilled: number;
  iconName: string;
  featured?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  college: string;
  department?: string;
  phone: string;
  role: UserRole;
  userAge?: string;
  collegeYear?: string;
  authProvider?: string;
  loginCount?: number;
  lastLoginAt?: string;
  isRegisterd?: number;
}

export interface PaymentReceipt {
  receiptNumber: string;
  ticketId: string;
  transactionId: string;
  amountPaid: number;
  paymentGateway: string;
  paymentScreenshot?: string;
  formResponseId?: string;
  eventName: string;
  userName: string;
  userEmail: string;
  userCollege: string;
  issuedAt: string;
  status: 'PAID' | 'VERIFIED';
}

export interface Registration {
  id: string;
  ticketHash: string;
  registrationNumber?: string;
  userId: string;
  userName: string;
  userAge?: string;
  userEmail: string;
  userPhone: string;
  userCollege: string;
  department?: string;
  collegeYear?: string;
  eventId: string;
  eventTitle: string;
  eventCategory: EventCategory;
  eventDay: EventDay;
  eventTime: string;
  eventVenue: string;
  teamName?: string;
  teamMembers?: string[];
  amountPaid: number;
  paymentGateway: string;
  transactionId: string;
  paymentScreenshot?: string;
  formResponseId?: string;
  registeredAt: string;
  paymentStatus: 'SUCCESS' | 'PENDING' | 'REFUNDED';
  attended: boolean;
  scannedAt?: string;
  receiptNumber?: string;
}

export interface AdminStats {
  totalRegistrations: number;
  totalRevenue: number;
  totalAttendees: number;
  techRegistrations: number;
  nonTechRegistrations: number;
  day1Count: number;
  day2Count: number;
  eventsPopularity: {
    eventId: string;
    eventTitle: string;
    category: EventCategory;
    count: number;
    revenue: number;
    capacityPct: number;
  }[];
}

export interface Participant {
  id?: string;
  name: string;
  email: string;
  phone: string;
  age?: string;
  college: string;
  department?: string;
  collegeYear?: string;
  totalPaidRegistrations?: number;
  isRegisterd?: number;
  lastRegisteredAt?: string;
  createdAt?: string;
}

export interface SentEmailLog {
  id: string;
  to: string;
  recipientEmail?: string;
  recipientName: string;
  subject: string;
  eventTitle: string;
  ticketHash: string;
  receiptNumber: string;
  amountPaid: number;
  sentAt: string;
  status: 'DELIVERED' | 'SENT' | 'SIMULATED' | 'FAILED' | 'RECORDED';
  previewUrl?: string;
  htmlContent: string;
}

export type DbRegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'CHECKED_IN';
export type DbPaymentStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'FAILED' | 'NOT_REQUIRED';

export interface RegistrationSubmissionPayload {
  participant: {
    full_name: string;
    email: string;
    phone: string;
    age?: number | string;
    college: string;
    department?: string;
    college_year?: string;
  };
  selected_events: Array<{
    event_id: string;
  }>;
  teams?: Array<{
    event_id: string;
    team_name: string;
    members: Array<{
      name: string;
      email?: string;
      phone?: string;
    }>;
  }>;
  payment: {
    transaction_id?: string;
    payment_screenshot_url?: string;
    payment_gateway?: string;
  };
}

export interface VerificationResponse {
  valid: boolean;
  status: 'APPROVED' | 'ALREADY_CHECKED_IN' | 'PENDING' | 'REJECTED' | 'INVALID' | 'ERROR';
  message: string;
  participant?: {
    name?: string;
    college?: string;
    department?: string;
  };
  events?: Array<{
    title: string;
    venue?: string;
    day?: string;
  }>;
  team?: {
    name: string;
    members: string[];
  } | null;
  checked_in?: boolean;
  registration_number?: string;
}


