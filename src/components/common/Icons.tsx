import {
  Home,
  Building,
  Building2,
  MapPin,
  Bed,
  Bath,
  Ruler,
  DollarSign,
  Key,
  Users,
  Phone,
  Mail,
  Calendar,
  Heart,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  Star,
  Camera,
  Map,
  Navigation,
  Bookmark,
  Share2,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Settings,
  User,
  Clock,
  TrendingUp,
  TrendingDown,
  Package,
  FileText,
  Image,
  Video,
  Briefcase,
  Shield,
  Award,
  Target,
  File,
  Network,
  Calculator,
  BadgeCheck,
  FolderOpen,
  ClipboardList,
  Wallet,
  ArrowRightLeft,
  X,
  Trash2,
  UserPlus,
  PiggyBank,
  BarChart,
  BookCheck,
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
  Delete: Trash2,
  
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