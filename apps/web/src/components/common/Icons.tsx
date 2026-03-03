import {
  AlertCircle,
  ArrowRightLeft,
  Award,
  BadgeCheck,
  BarChart,
  Bath,
  Bed,
  BookCheck,
  Bookmark,
  Briefcase,
  Building,
  Building2,
  Calculator,
  Calendar,
  Camera,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  ClipboardList,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  File,
  FileText,
  Filter,
  FolderOpen,
  Heart,
  Home,
  Image,
  Info,
  Key,
  Mail,
  Map,
  MapPin,
  Navigation,
  Network,
  Package,
  Phone,
  PiggyBank,
  Plus,
  Ruler,
  Search,
  Settings,
  Share2,
  Shield,
  Star,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  UserPlus,
  Users,
  Video,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

export const Icons = {
  // Property Types
  Home,
  Building,
  Building2,
  
  // Location
  MapPin,
  Map,
  Navigation,
  
  // Property Features
  Bed,
  Bath,
  Ruler,
  
  // Financial
  DollarSign,
  TrendingUp,
  TrendingDown,
  
  // Actions
  Key,
  Search,
  Filter,
  Heart,
  Bookmark,
  Share2,
  Download,
  Upload,
  
  // Communication
  Phone,
  Mail,
  Users,
  User,
  UserPlus,
  
  // UI Elements
  Calendar,
  Camera,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Star,
  
  // Status
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  
  // Media
  Image,
  Video,
  
  // Documents & Files
  FileText,
  File,
  ClipboardList,
  FolderOpen,
  
  // Real Estate Operations
  PropertyValuation: Calculator,
  ExistingProperties: Building2,
  Documents: FileText,
  QuickCheck: CheckCircle,
  DetailCheck: BookCheck,
  FinancingConfirmation: BadgeCheck,
  ApplicationPortfolio: FolderOpen,
  Assignments: ClipboardList,
  CostManagement: Wallet,
  Takeover: ArrowRightLeft,
  
  // Actions & Controls
  Settings,
  Reject: X,
  Close: X,
  Delete: Trash2,
  Add: Plus,
  OpenResult: ExternalLink,
  
  // Utilities
  Clock,
  Package,
  Briefcase,
  Shield,
  Award,
  Target,
  Network,
  Calculator,
  PiggyBank,
  BarChart,
};

export type IconName = keyof typeof Icons;
