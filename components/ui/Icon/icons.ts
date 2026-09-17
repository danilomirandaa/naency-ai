import type { IconComponentType } from '@devigner-ui/icons';
import { IconAdd } from '@devigner-ui/icons/Add';
import { IconAirplane } from '@devigner-ui/icons/Airplane';
import { IconAlertCircle } from '@devigner-ui/icons/AlertCircle';
import { IconArchive } from '@devigner-ui/icons/Archive';
import { IconArchiveUp } from '@devigner-ui/icons/ArchiveUp';
import { IconArrowLeftDown } from '@devigner-ui/icons/ArrowLeftDown';
import { IconArrowRight } from '@devigner-ui/icons/ArrowRight';
import { IconArrowRightUp } from '@devigner-ui/icons/ArrowRightUp';
import { IconBackspace } from '@devigner-ui/icons/Backspace';
import { IconBag } from '@devigner-ui/icons/Bag';
import { IconBank } from '@devigner-ui/icons/Bank';
import { IconBell } from '@devigner-ui/icons/Bell';
import { IconBillList } from '@devigner-ui/icons/BillList';
import { IconBolt } from '@devigner-ui/icons/Bolt';
import { IconBottle } from '@devigner-ui/icons/Bottle';
import { IconBus } from '@devigner-ui/icons/Bus';
import { IconCalculatorMinimalistic } from '@devigner-ui/icons/CalculatorMinimalistic';
import { IconCalendar } from '@devigner-ui/icons/Calendar';
import { IconCalendarMark } from '@devigner-ui/icons/CalendarMark';
import { IconCard } from '@devigner-ui/icons/Card';
import { IconCartLarge } from '@devigner-ui/icons/CartLarge';
import { IconCaseMinimalistic } from '@devigner-ui/icons/CaseMinimalistic';
import { IconCheck } from '@devigner-ui/icons/Check';
import { IconChevronDown } from '@devigner-ui/icons/ChevronDown';
import { IconChevronLeft } from '@devigner-ui/icons/ChevronLeft';
import { IconChevronRight } from '@devigner-ui/icons/ChevronRight';
import { IconChevronUp } from '@devigner-ui/icons/ChevronUp';
import { IconClockCircle } from '@devigner-ui/icons/ClockCircle';
import { IconClose } from '@devigner-ui/icons/Close';
import { IconCopy } from '@devigner-ui/icons/Copy';
import { IconCupHot } from '@devigner-ui/icons/CupHot';
import { IconDiskette } from '@devigner-ui/icons/Diskette';
import { IconDoubleAltArrowLeft } from '@devigner-ui/icons/DoubleAltArrowLeft';
import { IconDoubleAltArrowRight } from '@devigner-ui/icons/DoubleAltArrowRight';
import { IconDumbbell } from '@devigner-ui/icons/Dumbbell';
import { IconEye } from '@devigner-ui/icons/Eye';
import { IconFilter } from '@devigner-ui/icons/Filter';
import { IconGamepad } from '@devigner-ui/icons/Gamepad';
import { IconGasStation } from '@devigner-ui/icons/GasStation';
import { IconGift } from '@devigner-ui/icons/Gift';
import { IconGoogle } from '@devigner-ui/icons/Google';
import { IconGraphUp } from '@devigner-ui/icons/GraphUp';
import { IconHandMoney } from '@devigner-ui/icons/HandMoney';
import { IconHeartPulse } from '@devigner-ui/icons/HeartPulse';
import { IconHome } from '@devigner-ui/icons/Home';
import { IconInbox } from '@devigner-ui/icons/Inbox';
import { IconInfoCircle } from '@devigner-ui/icons/InfoCircle';
import { IconInfoSquare } from '@devigner-ui/icons/InfoSquare';
import { IconLayoutDashboard } from '@devigner-ui/icons/LayoutDashboard';
import { IconLogout2 } from '@devigner-ui/icons/Logout2';
import { IconMagnifer } from '@devigner-ui/icons/Magnifer';
import { IconMail } from '@devigner-ui/icons/Mail';
import { IconMenuDots } from '@devigner-ui/icons/MenuDots';
import { IconMonitor } from '@devigner-ui/icons/Monitor';
import { IconMoon } from '@devigner-ui/icons/Moon';
import { IconPaw } from '@devigner-ui/icons/Paw';
import { IconPen } from '@devigner-ui/icons/Pen';
import { IconPieChart2 } from '@devigner-ui/icons/PieChart2';
import { IconQuestionCircle } from '@devigner-ui/icons/QuestionCircle';
import { IconReceiptText } from '@devigner-ui/icons/ReceiptText';
import { IconRepeat } from '@devigner-ui/icons/Repeat';
import { IconSafeSquare } from '@devigner-ui/icons/SafeSquare';
import { IconSettings } from '@devigner-ui/icons/Settings';
import { IconShieldKeyhole } from '@devigner-ui/icons/ShieldKeyhole';
import { IconSidebarMinimalistic } from '@devigner-ui/icons/SidebarMinimalistic';
import { IconSmartphone } from '@devigner-ui/icons/Smartphone';
import { IconSortVertical } from '@devigner-ui/icons/SortVertical';
import { IconSpinner } from '@devigner-ui/icons/Spinner';
import { IconSquareAcademicCap } from '@devigner-ui/icons/SquareAcademicCap';
import { IconSun } from '@devigner-ui/icons/Sun';
import { IconTag } from '@devigner-ui/icons/Tag';
import { IconTarget } from '@devigner-ui/icons/Target';
import { IconTransferHorizontal } from '@devigner-ui/icons/TransferHorizontal';
import { IconTrashBinMinimalistic } from '@devigner-ui/icons/TrashBinMinimalistic';
import { IconTShirt } from '@devigner-ui/icons/TShirt';
import { IconUndo } from '@devigner-ui/icons/Undo';
import { IconUndoLeft } from '@devigner-ui/icons/UndoLeft';
import { IconUploadMinimalistic } from '@devigner-ui/icons/UploadMinimalistic';
import { IconUserRounded } from '@devigner-ui/icons/UserRounded';
import { IconWadOfMoney } from '@devigner-ui/icons/WadOfMoney';
import { IconWallet } from '@devigner-ui/icons/Wallet';
import { IconWaterdrop } from '@devigner-ui/icons/Waterdrop';
import { IconWifi } from '@devigner-ui/icons/Wifi';

/**
 * Registro central de ícones (Devigner Icons, família Solar). Componentes
 * referenciam ícones pelo nome (`<Icon icon="delete" />`), nunca importando o
 * pacote direto, para que a troca de um ícone aconteça em um lugar só.
 *
 * - Importe por subcaminho (`@devigner-ui/icons/<Nome>`): o índice do pacote tem
 *   5,5 MB e deixaria o dev server lento.
 * - Use só ícones da família Solar (viewBox 24×24) para manter o traço consistente.
 * - Licença CC BY 4.0 exige atribuição: docs/credits.md.
 */
export const icons = {
  // Ações
  add: IconAdd,
  edit: IconPen,
  delete: IconTrashBinMinimalistic,
  save: IconDiskette,
  copy: IconCopy,
  close: IconClose,
  check: IconCheck,
  search: IconMagnifer,
  return: IconUndoLeft,
  settings: IconSettings,
  view: IconEye,
  upload: IconUploadMinimalistic,
  calculator: IconCalculatorMinimalistic,
  backspace: IconBackspace,
  filter: IconFilter,
  'calendar-range': IconCalendarMark,
  archive: IconArchive,
  unarchive: IconArchiveUp,
  logout: IconLogout2,

  // Navegação
  'arrow-right': IconArrowRight,
  'chevron-up': IconChevronUp,
  'chevron-down': IconChevronDown,
  'chevron-left': IconChevronLeft,
  'chevron-right': IconChevronRight,
  'chevron-left-pipe': IconDoubleAltArrowLeft,
  'chevron-right-pipe': IconDoubleAltArrowRight,
  dots: IconMenuDots,
  sidebar: IconSidebarMinimalistic,
  selector: IconSortVertical,
  dashboard: IconLayoutDashboard,

  // Estado e feedback
  loading: IconSpinner,
  'alert-circle': IconAlertCircle,
  'info-icon': IconInfoCircle,
  'info-square': IconInfoSquare,
  inbox: IconInbox,
  clock: IconClockCircle,
  bell: IconBell,
  help: IconQuestionCircle,

  // Finanças
  income: IconArrowLeftDown,
  expense: IconArrowRightUp,
  transfer: IconTransferHorizontal,
  recurring: IconRepeat,
  wallet: IconWallet,
  'credit-card': IconCard,
  invoice: IconBillList,
  category: IconTag,
  calendar: IconCalendar,
  bank: IconBank,
  savings: IconSafeSquare,
  investment: IconGraphUp,
  cash: IconWadOfMoney,
  transactions: IconReceiptText,
  reports: IconPieChart2,
  goal: IconTarget,

  // Categorias (lib/categories.ts: CATEGORY_ICONS)
  'category-bills': IconBillList,
  'category-business': IconCaseMinimalistic,
  'category-clothes': IconTShirt,
  'category-education': IconSquareAcademicCap,
  'category-energy': IconBolt,
  'category-fitness': IconDumbbell,
  'category-food': IconCupHot,
  'category-fuel': IconGasStation,
  'category-gifts': IconGift,
  'category-health': IconHeartPulse,
  'category-home': IconHome,
  'category-internet': IconWifi,
  'category-investments': IconGraphUp,
  'category-kids': IconBottle,
  'category-leisure': IconGamepad,
  'category-market': IconCartLarge,
  'category-other': IconTag,
  'category-pets': IconPaw,
  'category-phone': IconSmartphone,
  'category-refund': IconUndo,
  'category-salary': IconHandMoney,
  'category-shopping': IconBag,
  'category-subscriptions': IconRepeat,
  'category-transport': IconBus,
  'category-travel': IconAirplane,
  'category-water': IconWaterdrop,

  // Diversos
  mail: IconMail,
  user: IconUserRounded,
  'theme-light': IconSun,
  'theme-dark': IconMoon,
  'theme-system': IconMonitor,
  'shield-lock': IconShieldKeyhole,

  // Marcas (logos de terceiros; exceção à família Solar)
  google: IconGoogle,
} satisfies Record<string, IconComponentType>;

export type Icons = keyof typeof icons;
